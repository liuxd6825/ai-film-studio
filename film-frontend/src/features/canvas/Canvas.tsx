import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  SelectionMode,
  useReactFlow,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type Viewport,
  type XYPosition,
  } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";

import {
  useCanvasStore,
  type CanvasNode,
  type CanvasEdge,
} from "./stores/canvasStore";
import { nodeTypes } from "./nodes";
import { NodeSelectionMenu } from "./NodeSelectionMenu";
import { ImageViewerModal } from "./ui/ImageViewerModal";
import { VideoViewerModal } from "./ui/VideoViewerModal";
import { AudioPlayerModal } from "./ui/AudioPlayerModal";
import { TextContentModal } from "./ui/TextContentModal";
import { TextNodeOrderModal } from "./ui/TextNodeOrderModal";
import { KeyframePanel } from "./components/KeyframePanel";
import { KeyframeModal } from "./ui/KeyframeModal";
import { ImageEditorModal } from "./ui/ImageEditorModal";
import { CustomEdge } from "./components/CustomEdge";
import { useProjectStore } from "../../stores/projectStore";
import { canvasApi } from "../../api/canvasApi";
import { canvasFileApi } from "../../api/canvasFileApi";
import { useThemeStore } from "@/stores/themeStore";

function safeParseJson<T>(value: string, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const SAVE_DEBOUNCE_MS = 500;

interface ClipboardSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  offsetX: number;
  offsetY: number;
}

export function Canvas() {
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const reactFlowInstance = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextPaneClickRef = useRef(false);
  const copiedSnapshotRef = useRef<ClipboardSnapshot | null>(null);
  const pasteIterationRef = useRef(0);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const interactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const viewportStartRef = useRef<{ x: number; y: number } | null>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setViewportState,
    setCanvasViewportSize,
    currentViewport,
    selectedNodeId,
    setSelectedNode,
    history,
    setInteractingWithInput,
    isLocked,
    isImageSelectorOpen,
    setCurrentZoom,
    setToolbarActions,
    textNodeOrderModal,
    closeTextNodeOrderModal,
    keyframeModal,
    closeKeyframeModal,
    addKeyframe,
    imageEditor,
    closeImageEditor,
  } = useCanvasStore();

  const { currentProjectId } = useProjectStore();
  const { canvasId: canvasIdFromUrl } = useParams<{ canvasId: string }>();
  const prevCanvasIdRef = useRef<string | undefined>(undefined);

  const handleKeyframeExtract = useCallback(
    async (timestamp: number, imageUrl: string, width?: number, height?: number) => {
      if (!keyframeModal.nodeId || !keyframeModal.videoUrl) {
        throw new Error("无效的关键帧数据");
      }
      
      try {
        const base64Response = await fetch(imageUrl);
        const blob = await base64Response.blob();
        const file = new File([blob], `keyframe_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        const response = await canvasFileApi.upload(
          currentProjectId || "default",
          canvasIdFromUrl || "",
          keyframeModal.nodeId,
          file,
        );
        
        const keyframe = addKeyframe(keyframeModal.nodeId, timestamp, response.downloadUrl, keyframeModal.videoUrl, width, height);
        if (!keyframe) {
          throw new Error("无法添加关键帧");
        }
      } catch (error) {
        console.error("Failed to extract keyframe:", error);
        const keyframe = addKeyframe(keyframeModal.nodeId, timestamp, imageUrl, keyframeModal.videoUrl, width, height);
        if (!keyframe) {
          throw new Error("无法添加关键帧");
        }
      }
    },
    [keyframeModal, addKeyframe, currentProjectId, canvasIdFromUrl],
  );

  const handleEditorSave = useCallback(
    (result: { download?: boolean; imageUrl: string; saveAsNewNode?: boolean }) => {
      if (!imageEditor.nodeId) return;

      if (result.download) {
        const link = document.createElement('a');
        link.href = result.imageUrl;
        link.download = 'edited_image.png';
        link.click();
      }

      if (result.saveAsNewNode) {
        // 创建新节点
        useCanvasStore.getState().addDerivedImageEditNode(
          imageEditor.nodeId,
          result.imageUrl,
          '1:1',
          result.imageUrl,
        );
      } else {
        // 更新节点图片
        useCanvasStore.getState().updateNodeData(imageEditor.nodeId, {
          imageUrl: result.imageUrl,
          previewImageUrl: result.imageUrl,
        });
      }

      closeImageEditor();
    },
    [imageEditor.nodeId, closeImageEditor],
  );

  const { theme: themeMode } = useThemeStore();
  const isDark = themeMode === "dark";

  useEffect(() => {
    const prevCanvasId = prevCanvasIdRef.current;
    if (
      canvasIdFromUrl &&
      prevCanvasId &&
      canvasIdFromUrl !== prevCanvasId &&
      currentProjectId
    ) {
      const currentNodes = useCanvasStore.getState().nodes;
      const currentEdges = useCanvasStore.getState().edges;
      const currentHistory = useCanvasStore.getState().history;
      const viewport = reactFlowInstance.getViewport();

      canvasApi
        .save(currentProjectId, prevCanvasId, {
          nodes: JSON.stringify(currentNodes),
          edges: JSON.stringify(currentEdges),
          viewport: JSON.stringify(viewport),
          history: JSON.stringify(currentHistory),
        })
        .catch((error) => {
          console.error("Failed to save previous canvas:", error);
        });
    }
    prevCanvasIdRef.current = canvasIdFromUrl;
  }, [canvasIdFromUrl, currentProjectId, reactFlowInstance]);

  const loadCanvasData = useCallback(
    async (projectId: string, canvasId: string) => {
      try {
        const data = await canvasApi.get(projectId, canvasId);
        const loadedNodes: CanvasNode[] = safeParseJson(data.nodes, []);
        const loadedEdges: CanvasEdge[] = safeParseJson(data.edges, []);
        const loadedHistory = safeParseJson(data.history, {
          past: [],
          future: [],
        });

        const canvasStore = useCanvasStore.getState();
        canvasStore.setProjectId(projectId);
        canvasStore.setCanvasName(data.name);
        canvasStore.setCanvasData(loadedNodes, loadedEdges, loadedHistory);
        canvasStore.setViewportState({ x: 0, y: 0, zoom: 1 });
        reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
        setCurrentZoom(1);

        const viewportSize = useCanvasStore.getState().canvasViewportSize;
        if (
          loadedNodes.length > 0 &&
          viewportSize.width > 0 &&
          viewportSize.height > 0
        ) {
          const nodeWidth = 220;
          const nodeHeight = 200;
          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          for (const node of loadedNodes) {
            const nx = node.position.x;
            const ny = node.position.y;
            const nw = (node.measured?.width ?? node.width) || nodeWidth;
            const nh = (node.measured?.height ?? node.height) || nodeHeight;
            minX = Math.min(minX, nx);
            minY = Math.min(minY, ny);
            maxX = Math.max(maxX, nx + nw);
            maxY = Math.max(maxY, ny + nh);
          }
          const contentCenterX = (minX + maxX) / 2;
          const contentCenterY = (minY + maxY) / 2;
          const viewportX = viewportSize.width / 2 - contentCenterX;
          const viewportY = viewportSize.height / 2 - contentCenterY;
          reactFlowInstance.setViewport({
            x: viewportX,
            y: viewportY,
            zoom: 1,
          });
          setCurrentZoom(1);
        }
      } catch (error) {
        console.error("Failed to load canvas:", error);
      }
    },
    [reactFlowInstance],
  );

  useEffect(() => {
    if (canvasIdFromUrl && currentProjectId) {
      loadCanvasData(currentProjectId, canvasIdFromUrl);
    }
  }, [canvasIdFromUrl, currentProjectId, loadCanvasData]);

  useEffect(() => {
    setToolbarActions({
      zoomIn: () => {
        reactFlowInstance.zoomIn();
        setCurrentZoom(reactFlowInstance.getViewport().zoom);
      },
      zoomOut: () => {
        reactFlowInstance.zoomOut();
        setCurrentZoom(reactFlowInstance.getViewport().zoom);
      },
      zoomReset: () => {
        if (nodes.length === 0) {
          reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 });
          setCurrentZoom(1);
          return;
        }
        const bounds = reactFlowInstance.getNodesBounds(nodes);
        const viewportSize = useCanvasStore.getState().canvasViewportSize;
        if (bounds) {
          const centerX = bounds.x + bounds.width / 2;
          const centerY = bounds.y + bounds.height / 2;
          const x = viewportSize.width / 2 - centerX;
          const y = viewportSize.height / 2 - centerY;
          reactFlowInstance.setViewport({ x, y, zoom: 1 });
          setCurrentZoom(1);
        }
      },
      manualSave: () => {
        persistCanvasSnapshot();
      },
    });
  }, [reactFlowInstance, nodes, setCurrentZoom, setToolbarActions]);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (
        target.closest("textarea") ||
        target.closest("input") ||
        target.closest("select") ||
        target.closest("[contenteditable]")
      ) {
        pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
        setInteractingWithInput(true);

        if (interactionTimerRef.current) {
          clearTimeout(interactionTimerRef.current);
        }
        interactionTimerRef.current = setTimeout(() => {
          pointerDownPosRef.current = null;
        }, 100);
      }

      if (e.metaKey && !e.button && e.button === 0) {
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX, y: e.clientY };
        viewportStartRef.current = { x: reactFlowInstance.getViewport().x, y: reactFlowInstance.getViewport().y };
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab';
        }
      }
    }

    function handlePointerMove(e: PointerEvent) {
      if (pointerDownPosRef.current && interactionTimerRef.current) {
        const dx = e.clientX - pointerDownPosRef.current.x;
        const dy = e.clientY - pointerDownPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
          clearTimeout(interactionTimerRef.current);
          interactionTimerRef.current = null;
          pointerDownPosRef.current = null;
          setInteractingWithInput(false);
        }
      }

      if (isPanningRef.current && panStartRef.current && viewportStartRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        reactFlowInstance.setViewport({
          x: viewportStartRef.current.x + dx,
          y: viewportStartRef.current.y + dy,
          zoom: reactFlowInstance.getViewport().zoom,
        });
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grabbing';
        }
      }
    }

    function handlePointerUp() {
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
        interactionTimerRef.current = null;
      }
      pointerDownPosRef.current = null;
      setInteractingWithInput(false);
      isPanningRef.current = false;
      panStartRef.current = null;
      viewportStartRef.current = null;
      if (containerRef.current) {
        containerRef.current.style.cursor = '';
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [reactFlowInstance, setInteractingWithInput]);

  const persistCanvasSnapshot = useCallback(() => {
    if (!currentProjectId || !canvasIdFromUrl) return;
    const currentNodes = useCanvasStore.getState().nodes;
    const currentEdges = useCanvasStore.getState().edges;
    const currentHistory = useCanvasStore.getState().history;
    const viewport = reactFlowInstance.getViewport();

    canvasApi
      .save(currentProjectId, canvasIdFromUrl, {
        nodes: JSON.stringify(currentNodes),
        edges: JSON.stringify(currentEdges),
        viewport: JSON.stringify(viewport),
        history: JSON.stringify(currentHistory),
      })
      .catch((error) => {
        console.error("Failed to save canvas:", error);
      });
  }, [currentProjectId, canvasIdFromUrl, reactFlowInstance]);

  const scheduleCanvasPersist = useCallback(
    (delayMs = SAVE_DEBOUNCE_MS) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        persistCanvasSnapshot();
      }, delayMs);
    },
    [persistCanvasSnapshot],
  );

  useEffect(() => {
    if (currentProjectId) {
      scheduleCanvasPersist();
    }
  }, [nodes, edges, history, currentProjectId, scheduleCanvasPersist]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      persistCanvasSnapshot();
    };
  }, [persistCanvasSnapshot]);

  const handlePaneClick = useCallback(() => {
    if (suppressNextPaneClickRef.current) {
      suppressNextPaneClickRef.current = false;
      return;
    }
    setMenuPosition(null);
    setSelectedNode(null);
  }, [setSelectedNode]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection);
    },
    [onConnect],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      onNodesChange(changes);
    },
    [onNodesChange],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<CanvasEdge>[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange],
  );

  const handleViewportChange = useCallback(
    (viewport: Viewport) => {
      setViewportState(viewport);
      setCurrentZoom(viewport.zoom);
    },
    [setViewportState],
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: CanvasNode[] }) => {
      if (selectedNodes.length === 1) {
        setSelectedNode(selectedNodes[0].id);
      } else if (selectedNodes.length === 0) {
        setSelectedNode(null);
      }
    },
    [setSelectedNode],
  );

  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isLocked) return;
      const target = event.target as HTMLElement;
      if (target.closest(".react-flow__node") !== null) {
        return;
      }
      const bounds = target.getBoundingClientRect();
      const screenPosition = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      const flowPosition =
        reactFlowInstance.screenToFlowPosition(screenPosition);
      setMenuPosition(screenPosition);
      useCanvasStore.setState({ lastAddNodePosition: flowPosition });
    },
    [isLocked, reactFlowInstance],
  );

  const copyNodes = useCallback(
    (nodeIds: string[]) => {
      const nodesToCopy = nodes.filter((n) => nodeIds.includes(n.id));
      if (nodesToCopy.length === 0) return;

      const bounds = nodesToCopy.reduce(
        (acc, n) => ({
          minX: Math.min(acc.minX, n.position.x),
          minY: Math.min(acc.minY, n.position.y),
          maxX: Math.max(acc.maxX, n.position.x + (n.measured?.width ?? 220)),
          maxY: Math.max(acc.maxY, n.position.y + (n.measured?.height ?? 200)),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
      );

      copiedSnapshotRef.current = {
        nodes: nodesToCopy,
        edges: edges.filter(
          (e) => nodeIds.includes(e.source) && nodeIds.includes(e.target),
        ),
        offsetX: bounds.minX,
        offsetY: bounds.minY,
      };
      pasteIterationRef.current = 1;
    },
    [nodes, edges],
  );

  const pasteNodes = useCallback((position?: XYPosition) => {
    const snapshot = copiedSnapshotRef.current;
    if (!snapshot) return;

    const iteration = pasteIterationRef.current;
    const offsetX = (position?.x ?? 100) * iteration - snapshot.offsetX + 20;
    const offsetY = (position?.y ?? 100) * iteration - snapshot.offsetY + 20;

    const nodeIdMap = new Map<string, string>();
    const newNodes: CanvasNode[] = snapshot.nodes.map((node) => {
      const newId = uuidv4();
      nodeIdMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
        selected: true,
        parentId: undefined,
        extent: undefined,
      };
    });

    const newEdges: CanvasEdge[] = snapshot.edges
      .map((edge) => {
        const newSource = nodeIdMap.get(edge.source);
        const newTarget = nodeIdMap.get(edge.target);
        if (!newSource || !newTarget) return null;
        return {
          ...edge,
          id: uuidv4(),
          source: newSource,
          target: newTarget,
        };
      })
      .filter((e): e is CanvasEdge => e !== null);

    const store = useCanvasStore.getState();
    store.setCanvasData(
      [...store.nodes.map((n) => ({ ...n, selected: false })), ...newNodes],
      [...store.edges, ...newEdges],
    );

    pasteIterationRef.current += 1;
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const handleManualSave = useCallback(() => {
    if (isSaving) return;
    setIsSaving(true);
    persistCanvasSnapshot();
    setTimeout(() => setIsSaving(false), 500);
  }, [isSaving, persistCanvasSnapshot]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        if (
          selectedNodeId &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA" &&
          !(document.activeElement as HTMLElement)?.isContentEditable
        ) {
          useCanvasStore.getState().deleteNode(selectedNodeId);
        }
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      if (isCtrlOrCmd && event.key === "z" && !event.shiftKey) {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA" ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return;
        }
        event.preventDefault();
        useCanvasStore.getState().undo();
      }
      if (
        isCtrlOrCmd &&
        (event.key === "y" || (event.key === "z" && event.shiftKey))
      ) {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA" ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return;
        }
        event.preventDefault();
        useCanvasStore.getState().redo();
      }
      if (isCtrlOrCmd && event.key === "g") {
        event.preventDefault();
        const selectedNodes = nodes.filter((n) => n.selected);
        if (selectedNodes.length >= 2) {
          const ids = selectedNodes.map((n) => n.id);
          useCanvasStore.getState().groupNodes(ids);
        }
      }
      if (isCtrlOrCmd && event.key === "c") {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA" ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return;
        }
        event.preventDefault();
        const selectedNodes = nodes.filter((n) => n.selected);
        if (selectedNodes.length > 0) {
          copyNodes(selectedNodes.map((n) => n.id));
        }
      }
      if (isCtrlOrCmd && event.key === "v") {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA" ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return;
        }
        event.preventDefault();
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const flowPos = reactFlowInstance.screenToFlowPosition({
            x: centerX,
            y: centerY,
          });
          pasteNodes(flowPos);
        } else {
          pasteNodes();
        }
      }

      if (event.key === "a" && isCtrlOrCmd) {
        event.preventDefault();
      }
      if (isCtrlOrCmd && event.key === "s") {
        event.preventDefault();
        handleManualSave();
      }
    },
    [selectedNodeId, nodes, copyNodes, pasteNodes, handleManualSave],
  );

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasViewportSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [setCanvasViewportSize]);

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
  }, []);

  const handleKeyframeDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const keyframeData = event.dataTransfer.getData("application/keyframe");
      if (!keyframeData) return;

      try {
        const keyframe = JSON.parse(keyframeData);
        const bounds = containerRef.current?.getBoundingClientRect();
        if (!bounds) return;

        const aspectRatio = keyframe.width && keyframe.height
          ? `${keyframe.width}:${keyframe.height}`
          : "16:9";

        const store = useCanvasStore.getState();
        const newNodeId = store.addDerivedImageEditNode(
          keyframe.videoNodeId,
          keyframe.imageUrl,
          aspectRatio,
          keyframe.imageUrl,
        );

        if (newNodeId) {
          store.setSelectedNode(newNodeId);
        }
      } catch (error) {
        console.error("Failed to create node from keyframe:", error);
      }
    },
    [reactFlowInstance],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onDrop={handleKeyframeDrop}
      onDragOver={handleDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onPaneClick={handlePaneClick}
        onDoubleClick={handlePaneDoubleClick}
        onViewportChange={handleViewportChange}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        defaultViewport={currentViewport}
        minZoom={0.1}
        maxZoom={5}
        selectionOnDrag={false}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode={["Control", "Meta"]}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        fitView={nodes.length === 0}
        deleteKeyCode={isLocked || isImageSelectorOpen ? null : "Delete"}
        nodesDraggable={!isLocked && !isImageSelectorOpen}
        nodesConnectable={!isLocked && !isImageSelectorOpen}
        panOnDrag={false}
        elementsSelectable={!isLocked && !isImageSelectorOpen}
        colorMode={isDark ? "dark" : "light"}
        edgeTypes={{ floatingDelete: CustomEdge }}
        defaultEdgeOptions={{
          type: "floatingDelete",
          style: { strokeWidth: 4, opacity: 1 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={isDark ? "#4a5568" : "#2a2a2a"}
          className={isDark ? "dark:bg-gray-900" : ""}
        />
        <MiniMap 
          pannable 
          zoomable 
          className={isDark ? "!bg-gray-800" : ""}
          nodeColor={isDark ? "#60a5fa" : undefined}
        />
      </ReactFlow>

      {menuPosition && (
        <NodeSelectionMenu position={menuPosition} onClose={closeMenu} />
      )}

      <ImageViewerModal />

      <VideoViewerModal />

      <AudioPlayerModal />

      <TextContentModal />

      <KeyframePanel />

      {textNodeOrderModal.isOpen && textNodeOrderModal.targetNodeId && (
        <TextNodeOrderModal
          targetNodeId={textNodeOrderModal.targetNodeId}
          onClose={closeTextNodeOrderModal}
        />
      )}

      {keyframeModal.isOpen && keyframeModal.nodeId && keyframeModal.videoUrl && (
        <KeyframeModal
          nodeId={keyframeModal.nodeId}
          videoUrl={keyframeModal.videoUrl}
          duration={keyframeModal.duration}
          onClose={closeKeyframeModal}
          onExtract={handleKeyframeExtract}
        />
      )}

      {imageEditor.isOpen && imageEditor.imageUrl && (
        <ImageEditorModal
          open={imageEditor.isOpen}
          imageUrl={imageEditor.imageUrl}
          nodeId={imageEditor.nodeId || ''}
          onClose={closeImageEditor}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
}
