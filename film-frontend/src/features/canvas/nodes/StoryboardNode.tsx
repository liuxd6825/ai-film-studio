import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { EditableNodeTitle } from "../components/EditableNodeTitle";

import {
  type StoryboardFrameItem,
  type StoryboardExportOptions,
  type StoryboardSplitNodeData,
  isUploadNode,
  isImageEditNode,
  isExportImageNode,
} from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { NodeToolbar } from "../ui/NodeToolbar";

interface StoryboardNodeDataExt extends StoryboardSplitNodeData {}

const STORYBOARD_NODE_WIDTH = 320;
const STORYBOARD_GRID_GAP = 2;

function toCssAspectRatio(aspectRatio: string): string {
  const [rawWidth = "1", rawHeight = "1"] = aspectRatio.split(":");
  const width = Number(rawWidth);
  const height = Number(rawHeight);
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return "1 / 1";
  }
  return `${width} / ${height}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveExportOptions(
  options?: StoryboardExportOptions,
): StoryboardExportOptions {
  const defaults: StoryboardExportOptions = {
    showFrameIndex: false,
    showFrameNote: false,
    notePlacement: "overlay",
    imageFit: "cover",
    frameIndexPrefix: "S",
    cellGap: 8,
    outerPadding: 0,
    fontSize: 4,
    backgroundColor: "#0f1115",
    textColor: "#f8fafc",
  };
  if (!options) return defaults;
  return {
    ...defaults,
    ...options,
    fontSize: clamp(Math.round(options.fontSize ?? 4), 1, 20),
  };
}

interface FrameCardProps {
  nodeId: string;
  frame: StoryboardFrameItem;
  index: number;
  frameAspectRatioCss: string;
  imageFit: "cover" | "contain";
  draggedFrameId: string | null;
  dropTargetFrameId: string | null;
  onSortStart: (frameId: string) => void;
  onSortHover: (frameId: string) => void;
  onImageSelect: (
    frameId: string,
    imageUrl: string,
    previewImageUrl: string | null,
  ) => void;
  availableImages: Array<{
    imageUrl: string;
    previewImageUrl: string | null;
    label: string;
  }>;
}

const FrameCard = memo(function FrameCard({
  nodeId,
  frame,
  index,
  frameAspectRatioCss,
  imageFit,
  draggedFrameId,
  dropTargetFrameId,
  onSortStart,
  onSortHover,
  onImageSelect,
  availableImages,
}: FrameCardProps) {
  const updateStoryboardFrame = useCanvasStore((s) => s.updateStoryboardFrame);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });

  const dragging = draggedFrameId === frame.id;
  const asDropTarget = dropTargetFrameId === frame.id && !dragging;

  const handleTogglePicker = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPickerPosition({ x: e.clientX, y: e.clientY });
    setShowImagePicker((prev) => !prev);
  }, []);

  return (
    <div
      className={`relative transition-colors ${
        dragging
          ? "z-10 opacity-60 ring-1 ring-blue-400"
          : asDropTarget
            ? "z-10 ring-1 ring-green-400"
            : ""
      }`}
      onPointerEnter={() => onSortHover(frame.id)}
      onPointerMove={() => onSortHover(frame.id)}
    >
      <div
        className={`group/frame relative overflow-hidden bg-gray-100 dark:bg-gray-700 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ aspectRatio: frameAspectRatioCss }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          onSortStart(frame.id);
        }}
      >
        {frame.imageUrl ? (
          <img
            src={frame.imageUrl}
            alt=""
            className={`h-full w-full ${imageFit === "contain" ? "object-contain" : "object-cover"}`}
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
            空分镜
          </div>
        )}

        <button
          type="button"
          className="absolute bottom-1 right-1 rounded bg-black/60 p-1 text-white opacity-0 transition-all duration-150 hover:bg-black/75 group-hover/frame:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleTogglePicker}
          title="从输入图片替换"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M1 5.25A2.25 2.25 0 0 1 3.25 3h5.372a.75.75 0 0 1 0 1.5H4.5v8.044A2.25 2.25 0 0 1 3.25 13.5H2.25A2.25 2.25 0 0 1 0 11.25V5.25z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <textarea
        value={frame.note}
        onChange={(e) => {
          const nextValue = e.target.value;
          updateStoryboardFrame(nodeId, frame.id, { note: nextValue });
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onWheelCapture={(e) => e.stopPropagation()}
        placeholder={`分镜 ${String(index + 1).padStart(2, "0")}`}
        className="nodrag nowheel h-10 w-full resize-none border-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs outline-none focus:border-blue-400 text-gray-700 dark:text-gray-300"
      />

      {showImagePicker && (
        <div
          className="fixed z-50 w-32 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg"
          style={{ left: pickerPosition.x, top: pickerPosition.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {availableImages.length > 0 ? (
            <div className="max-h-40 overflow-y-auto">
              {availableImages.map((item, i) => (
                <button
                  key={`${frame.id}-${item.imageUrl}-${i}`}
                  type="button"
                  className="flex w-full items-center gap-2 border-b border-gray-100 dark:border-gray-700 px-2 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => {
                    onImageSelect(
                      frame.id,
                      item.imageUrl,
                      item.previewImageUrl,
                    );
                    setShowImagePicker(false);
                  }}
                >
                  {item.previewImageUrl || item.imageUrl ? (
                    <img
                      src={item.previewImageUrl || item.imageUrl}
                      alt={item.label}
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : null}
                  <span className="truncate text-gray-700 dark:text-gray-300">{item.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-2 py-2 text-xs text-gray-500 dark:text-gray-400">暂无输入图片</div>
          )}
        </div>
      )}
    </div>
  );
});

interface ExportSettingsPanelProps {
  exportOptions: StoryboardExportOptions;
  onPatchOptions: (patch: Partial<StoryboardExportOptions>) => void;
  onClose: () => void;
}

function ExportSettingsPanel({
  exportOptions,
  onPatchOptions,
  onClose,
}: ExportSettingsPanelProps) {
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">导出设置</span>
        <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={exportOptions.showFrameIndex}
            onChange={(e) =>
              onPatchOptions({ showFrameIndex: e.target.checked })
            }
            className="rounded"
          />
          显示分镜序号
        </label>

        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={exportOptions.showFrameNote}
            onChange={(e) =>
              onPatchOptions({ showFrameNote: e.target.checked })
            }
            className="rounded"
          />
          显示分镜描述
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="mb-1 text-gray-500 dark:text-gray-400">图片填充</div>
            <select
              value={exportOptions.imageFit}
              onChange={(e) =>
                onPatchOptions({
                  imageFit: e.target.value as "cover" | "contain",
                })
              }
              className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="cover">填充满格子</option>
              <option value="contain">完整显示</option>
            </select>
          </div>
          <div>
            <div className="mb-1 text-gray-500 dark:text-gray-400">描述位置</div>
            <select
              value={exportOptions.notePlacement}
              onChange={(e) =>
                onPatchOptions({
                  notePlacement: e.target.value as "overlay" | "bottom",
                })
              }
              className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="overlay">图上遮罩</option>
              <option value="bottom">图下文字</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="mb-1 text-gray-500 dark:text-gray-400">间距</div>
            <input
              type="number"
              min={0}
              max={120}
              value={exportOptions.cellGap}
              onChange={(e) =>
                onPatchOptions({ cellGap: Number(e.target.value) || 0 })
              }
              className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <div className="mb-1 text-gray-500 dark:text-gray-400">字号(%)</div>
            <input
              type="number"
              min={1}
              max={20}
              value={exportOptions.fontSize}
              onChange={(e) =>
                onPatchOptions({ fontSize: Number(e.target.value) || 4 })
              }
              className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="mb-1 text-gray-500 dark:text-gray-400">序号前缀</div>
            <input
              type="text"
              maxLength={4}
              value={exportOptions.frameIndexPrefix}
              onChange={(e) =>
                onPatchOptions({ frameIndexPrefix: e.target.value })
              }
              className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="mb-1 text-gray-500 dark:text-gray-400">背景色</div>
            <input
              type="color"
              value={exportOptions.backgroundColor}
              onChange={(e) =>
                onPatchOptions({ backgroundColor: e.target.value })
              }
              className="h-7 w-full rounded border border-gray-200 dark:border-gray-600"
            />
          </div>
          <div>
            <div className="mb-1 text-gray-500 dark:text-gray-400">文字色</div>
            <input
              type="color"
              value={exportOptions.textColor}
              onChange={(e) => onPatchOptions({ textColor: e.target.value })}
              className="h-7 w-full rounded border border-gray-200 dark:border-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const StoryboardNode = memo(function StoryboardNode({
  id,
  data,
  selected,
}: NodeProps & { data: StoryboardNodeDataExt }) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const reorderStoryboardFrame = useCanvasStore(
    (s) => s.reorderStoryboardFrame,
  );
  const updateStoryboardFrame = useCanvasStore((s) => s.updateStoryboardFrame);
  const addDerivedExportNode = useCanvasStore((s) => s.addDerivedExportNode);
  const addEdge = useCanvasStore((s) => s.addEdge);
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);
  const openImageViewer = useCanvasStore((s) => s.openImageViewer);
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  const [draggedFrameId, setDraggedFrameId] = useState<string | null>(null);
  const [dropTargetFrameId, setDropTargetFrameId] = useState<string | null>(
    null,
  );
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const orderedFrames = useMemo(
    () => [...data.frames].sort((a, b) => a.order - b.order),
    [data.frames],
  );

  const frameAspectRatio = useMemo(
    () =>
      data.frameAspectRatio ??
      orderedFrames.find((f) => f.aspectRatio)?.aspectRatio ??
      "16:9",
    [data.frameAspectRatio, orderedFrames],
  );

  const frameAspectRatioCss = useMemo(
    () => toCssAspectRatio(frameAspectRatio),
    [frameAspectRatio],
  );

  const gridCols = Math.max(1, data.gridCols);
  const gridRows = Math.max(1, data.gridRows);
  const totalFrames = orderedFrames.length;

  const exportOptions = useMemo(
    () => resolveExportOptions(data.exportOptions),
    [data.exportOptions],
  );

  const incomingImageItems = useMemo(() => {
    const nodeById = new Map(nodes.map((n) => [n.id, n] as const));
    const sourceNodeIds = edges
      .filter((e) => e.target === id)
      .map((e) => e.source);
    const imageItems: Array<{
      imageUrl: string;
      previewImageUrl: string | null;
      label: string;
    }> = [];

    for (const sourceNodeId of sourceNodeIds) {
      const sourceNode = nodeById.get(sourceNodeId);
      if (!sourceNode) continue;
      if (
        !isUploadNode(sourceNode) &&
        !isImageEditNode(sourceNode) &&
        !isExportImageNode(sourceNode)
      )
        continue;
      const imageUrl = (sourceNode.data as { imageUrl?: string }).imageUrl;
      if (!imageUrl) continue;
      const previewImageUrl =
        (sourceNode.data as { previewImageUrl?: string | null })
          .previewImageUrl ?? null;
      const displayName =
        (sourceNode.data as { displayName?: string }).displayName ?? "图片";
      imageItems.push({ imageUrl, previewImageUrl, label: displayName });
    }

    return imageItems;
  }, [edges, id, nodes]);

  const frameViewerImageList = useMemo(
    () =>
      orderedFrames
        .map((frame) => frame.imageUrl || frame.previewImageUrl)
        .filter((url): url is string => Boolean(url)),
    [orderedFrames],
  );

  const handleSortStart = useCallback((frameId: string) => {
    setDraggedFrameId(frameId);
    setDropTargetFrameId(frameId);
  }, []);

  const handleSortHover = useCallback(
    (frameId: string) => {
      if (!draggedFrameId) return;
      setDropTargetFrameId(frameId);
    },
    [draggedFrameId],
  );

  const finalizeSort = useCallback(() => {
    if (!draggedFrameId) return;
    if (dropTargetFrameId && dropTargetFrameId !== draggedFrameId) {
      reorderStoryboardFrame(id, draggedFrameId, dropTargetFrameId);
    }
    setDraggedFrameId(null);
    setDropTargetFrameId(null);
  }, [draggedFrameId, dropTargetFrameId, id, reorderStoryboardFrame]);

  useEffect(() => {
    if (!draggedFrameId) return;

    const handlePointerUp = () => finalizeSort();
    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [draggedFrameId, finalizeSort]);

  const handleImageSelect = useCallback(
    (frameId: string, imageUrl: string, previewImageUrl: string | null) => {
      updateStoryboardFrame(id, frameId, {
        imageUrl,
        previewImageUrl,
      });
    },
    [id, updateStoryboardFrame],
  );

  const patchExportOptions = useCallback(
    (patch: Partial<StoryboardExportOptions>) => {
      updateNodeData(id, {
        exportOptions: {
          ...exportOptions,
          ...patch,
        },
      });
    },
    [exportOptions, id, updateNodeData],
  );

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    if (orderedFrames.length === 0) {
      setExportError("没有可导出的分镜");
      return;
    }

    const frameSources = orderedFrames.map(
      (f) => f.imageUrl || f.previewImageUrl || "",
    );
    const nonEmptyFrames = frameSources.filter((s) => s).length;
    if (nonEmptyFrames === 0) {
      setExportError("没有可导出的图片");
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const canvas = document.createElement("canvas");
      const cellGap = clamp(exportOptions.cellGap, 0, 120);
      const firstValidSource = frameSources.find((s) => s);

      let cellWidth = 200;
      let cellHeight = 150;
      if (firstValidSource) {
        try {
          const img = new window.Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = firstValidSource;
          });
          const ratio = img.naturalHeight / img.naturalWidth;
          cellHeight = Math.round(cellWidth * ratio);
        } catch {
          cellHeight = Math.round(cellWidth * 0.75);
        }
      }

      const noteHeight =
        exportOptions.showFrameNote && exportOptions.notePlacement === "bottom"
          ? 40
          : 0;
      const outerPadding = exportOptions.outerPadding || 0;

      canvas.width =
        gridCols * cellWidth + (gridCols - 1) * cellGap + outerPadding * 2;
      canvas.height =
        gridRows * (cellHeight + noteHeight) +
        (gridRows - 1) * cellGap +
        outerPadding * 2;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("无法创建画布上下文");

      ctx.fillStyle = exportOptions.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const fontSize = clamp(Math.round(exportOptions.fontSize * 3), 10, 60);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textBaseline = "top";

      for (let i = 0; i < orderedFrames.length; i++) {
        const frame = orderedFrames[i];
        if (i >= gridRows * gridCols) break;

        const row = Math.floor(i / gridCols);
        const col = i % gridCols;
        const x = outerPadding + col * (cellWidth + cellGap);
        const y = outerPadding + row * (cellHeight + noteHeight + cellGap);

        const sourceUrl = frame.imageUrl || frame.previewImageUrl;
        if (sourceUrl) {
          try {
            const img = new window.Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = reject;
              img.src = sourceUrl;
            });

            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, cellWidth, cellHeight);
            ctx.clip();

            if (exportOptions.imageFit === "contain") {
              const imgRatio = img.naturalWidth / img.naturalHeight;
              const cellRatio = cellWidth / cellHeight;
              let drawWidth, drawHeight, drawX, drawY;
              if (imgRatio > cellRatio) {
                drawWidth = cellHeight * imgRatio;
                drawHeight = cellHeight;
                drawX = x + (cellWidth - drawWidth) / 2;
                drawY = y;
              } else {
                drawWidth = cellWidth;
                drawHeight = cellWidth / imgRatio;
                drawX = x;
                drawY = y + (cellHeight - drawHeight) / 2;
              }
              ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            } else {
              ctx.drawImage(img, x, y, cellWidth, cellHeight);
            }
            ctx.restore();
          } catch {
            ctx.fillStyle = "#333";
            ctx.fillRect(x, y, cellWidth, cellHeight);
          }
        } else {
          ctx.fillStyle = "#333";
          ctx.fillRect(x, y, cellWidth, cellHeight);
        }

        if (exportOptions.showFrameIndex) {
          const label = `${exportOptions.frameIndexPrefix}${i + 1}`;
          ctx.fillStyle = "rgba(0,0,0,0.65)";
          ctx.fillRect(
            x + 4,
            y + 4,
            ctx.measureText(label).width + 12,
            fontSize + 8,
          );
          ctx.fillStyle = exportOptions.textColor;
          ctx.fillText(label, x + 10, y + 8);
        }

        if (exportOptions.showFrameNote && frame.note) {
          if (exportOptions.notePlacement === "overlay") {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(
              x,
              y + cellHeight - fontSize - 8,
              cellWidth,
              fontSize + 8,
            );
            ctx.fillStyle = exportOptions.textColor;
            ctx.fillText(frame.note, x + 4, y + cellHeight - fontSize - 2);
          } else if (noteHeight > 0) {
            ctx.fillStyle = exportOptions.textColor;
            ctx.fillText(frame.note, x + 4, y + cellHeight + 4);
          }
        }
      }

      const dataUrl = canvas.toDataURL("image/png");
      const aspectRatio = `${canvas.width}:${canvas.height}`;

      const createdNodeId = addDerivedExportNode(
        id,
        dataUrl,
        aspectRatio,
        dataUrl,
        {
          defaultTitle: "分镜导出",
          resultKind: "storyboardSplitExport",
        },
      );

      if (createdNodeId) {
        addEdge(id, createdNodeId);
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "导出失败");
    } finally {
      setIsExporting(false);
    }
  }, [
    addDerivedExportNode,
    addEdge,
    exportOptions,
    gridCols,
    gridRows,
    id,
    isExporting,
    orderedFrames,
  ]);

  const handleDelete = useCallback(() => {
    deleteNode(id);
  }, [id, deleteNode]);

  return (
    <>
      <NodeToolbar nodeId={id} visible={selected}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          title="删除"
        >
          <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
        </button>
      </NodeToolbar>
      <div
        className={`rounded-lg border-2 bg-white dark:bg-gray-800 shadow-md transition-colors ${
          selected ? "border-blue-500" : "border-gray-200 dark:border-gray-700"
        }`}
        style={{ width: STORYBOARD_NODE_WIDTH }}
        onClick={() => setSelectedNode(id)}
      >
      <div className="relative border-b border-gray-100 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <EditableNodeTitle
            nodeType="故事板"
            title={data.displayName || ""}
            onSave={(newTitle) => updateNodeData(id, { displayName: newTitle })}
            maxLength={50}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {gridRows}x{gridCols} | {totalFrames}格
            </span>
            <button
              className={`rounded px-2 py-1 text-xs ${
                isExportPanelOpen
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsExportPanelOpen((prev) => !prev);
              }}
            >
              设置
            </button>
          </div>
        </div>

        {isExportPanelOpen && (
          <ExportSettingsPanel
            exportOptions={exportOptions}
            onPatchOptions={patchExportOptions}
            onClose={() => setIsExportPanelOpen(false)}
          />
        )}
      </div>

      <div
        className="nowheel min-h-0 overflow-auto p-3"
        onWheelCapture={(e) => e.stopPropagation()}
      >
        <div
          className="grid overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
          style={{
            gap: `${STORYBOARD_GRID_GAP}px`,
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          }}
        >
          {orderedFrames.map((frame, index) => (
            <FrameCard
              key={frame.id}
              nodeId={id}
              frame={frame}
              index={index}
              frameAspectRatioCss={frameAspectRatioCss}
              imageFit={exportOptions.imageFit}
              draggedFrameId={draggedFrameId}
              dropTargetFrameId={dropTargetFrameId}
              onSortStart={handleSortStart}
              onSortHover={handleSortHover}
              onImageSelect={handleImageSelect}
              availableImages={incomingImageItems}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 p-3">
        {exportError && (
          <span className="text-xs text-red-500 dark:text-red-400">{exportError}</span>
        )}
        <div className="ml-auto flex gap-2">
          {frameViewerImageList.length > 0 && (
            <button
              className="rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                openImageViewer(frameViewerImageList[0], frameViewerImageList);
              }}
            >
              预览
            </button>
          )}
          <button
            className={`rounded px-2 py-1 text-xs ${
              isExporting
                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                : "bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleExport();
            }}
            disabled={isExporting}
          >
            {isExporting ? "导出中..." : "导出"}
          </button>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
    </>
  );
});

StoryboardNode.displayName = "StoryboardNode";
