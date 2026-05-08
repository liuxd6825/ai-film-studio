import { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Eye, X, Play, Film, Download, Trash2, Image, Upload, RefreshCw } from "lucide-react";
import {
  VideoGenNodeData,
  VideoResolution,
  isUploadNode,
  isExportImageNode,
  isImageEditNode,
  IMAGE_ASPECT_RATIOS,
  CANVAS_NODE_TYPES,
  TextNodeData,
} from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { videoApi, type GenerateVideoRequest, type VideoAiModel } from "../../../api/videoApi";
import { canvasTaskApi } from "../../../api/canvasTaskApi";
import { canvasFileApi } from "../../../api/canvasFileApi";
import { VideoSelectorModal } from "../ui/VideoSelectorModal";
import { downloadUrl } from "../domain/downloadUtils";
import { NodeToolbar } from "../ui/NodeToolbar";
import { NodeTextarea } from "../components/NodeTextarea";
import { EditableNodeTitle } from "../components/EditableNodeTitle";
import { VideoSettingCard } from "../components/VideoSettingCard";
import { ConfirmDialog } from "../ui/ConfirmDialog";

const RESOLUTION_OPTIONS: { value: VideoResolution; label: string }[] = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "4K", label: "4K" },
];



const DURATION_OPTIONS = [
  { value: "4", label: "4秒" },
  { value: "5", label: "5秒" },
  { value: "6", label: "6秒" },
  { value: "7", label: "7秒" },
  { value: "8", label: "8秒" },
  { value: "9", label: "9秒" },
  { value: "10", label: "10秒" },
  { value: "11", label: "11秒" },
  { value: "12", label: "12秒" },
  { value: "13", label: "13秒" },
  { value: "14", label: "14秒" },
  { value: "15", label: "15秒" },
];

const ASPECT_RATIOS = IMAGE_ASPECT_RATIOS.map((ratio) => ({
  value: ratio,
  label: ratio,
}));

const pulseGlowStyles = `
@keyframes pulseGlow {
  0% {
    transform: scale(0.85);
    box-shadow: 0 0 30px 10px rgba(139, 92, 246, 0.5), inset 0 0 20px 5px rgba(139, 92, 246, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 60px 25px rgba(99, 102, 241, 0.7), inset 0 0 30px 10px rgba(99, 102, 241, 0.4);
  }
  100% {
    transform: scale(0.85);
    box-shadow: 0 0 30px 10px rgba(139, 92, 246, 0.5), inset 0 0 20px 5px rgba(139, 92, 246, 0.3);
  }
}

.preview-glow {
  background: radial-gradient(
    circle at center,
    rgba(139, 92, 246, 0.5) 0%,
    rgba(99, 102, 241, 0.3) 40%,
    rgba(168, 85, 247, 0.2) 70%,
    transparent 100%
  );
  animation: pulseGlow 2s ease-in-out infinite;
  border: 2px solid rgba(139, 92, 246, 0.6);
}

.preview-glow::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%
  );
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .preview-glow {
    animation: none;
    box-shadow: 0 0 20px 5px rgba(139, 92, 246, 0.3);
    border: 2px solid rgba(139, 92, 246, 0.4);
  }
}
`;

interface IncomingImage {
  id: string;
  imageUrl: string;
  previewImageUrl?: string | null;
  label: string;
  sourceNodeId: string;
}

export const VideoGenNode = memo(function VideoGenNode({
                                                         id,
                                                         data,
                                                         selected,
                                                       }: NodeProps & { data: VideoGenNodeData }) {
  const { canvasId } = useParams<{ canvasId: string }>();
  const projectId = useCanvasStore((s) => s.projectId);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);
  const openVideoViewer = useCanvasStore((s) => s.openVideoViewer);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const openTextNodeOrderModal = useCanvasStore((s) => s.openTextNodeOrderModal);
  const openKeyframeModal = useCanvasStore((s) => s.openKeyframeModal);

  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableAIModels, setAvailableAIModels] = useState<VideoAiModel[]>([]);
  const [taskStatus, setTaskStatus] = useState(data.taskStatus || "idle");
  const [taskProgress, setTaskProgress] = useState(data.taskProgress || 0);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveMode = data.mode || 'prompt';

  const panelRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (selected) {
      setShowFloatingPanel(true);
    } else {
      setShowFloatingPanel(false);
    }
  }, [selected]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      const isVideoSettingClick =
        target.closest?.("[data-video-setting-card]") ||
        target.closest?.("[data-video-setting-trigger]") ||
        target.closest?.("[data-video-setting-dropdown]") ||
        target.closest?.("[data-video-setting-overlay]");
      if (
        showFloatingPanel &&
        !isVideoSettingClick &&
        panelRef.current &&
        resultRef.current &&
        !panelRef.current.contains(target as Node) &&
        !resultRef.current.contains(target as Node)
      ) {
        setShowFloatingPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFloatingPanel]);

  useEffect(() => {
    if (showFloatingPanel && data.prompt && panelRef.current) {
      const textarea = panelRef.current.querySelector("textarea");
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }
  }, [showFloatingPanel, data.prompt]);

  useEffect(() => {
    if (showFloatingPanel) {
      videoApi.getModels(projectId || "default").then((models) => {
        setAvailableAIModels(models);
        if (!models.some((m) => m.id === data.aiModel)) {
          updateNodeData(id, { aiModel: models[0]?.id || "veo" });
        }
      });
    }
  }, [showFloatingPanel]);

  useEffect(() => {
    if (data.taskStatus) {
      setTaskStatus(data.taskStatus);
    }
    if (data.taskProgress) {
      setTaskProgress(data.taskProgress);
    }
  }, [data.taskStatus, data.taskProgress]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const taskId = data.taskId;
    if (
      taskId &&
      (data.taskStatus === "pending" || data.taskStatus === "processing")
    ) {
      setTaskStatus(data.taskStatus);
      setTaskProgress(data.taskProgress || 0);
      setIsGenerating(true);

      canvasTaskApi
        .poll(projectId || "default", taskId)
        .then((result) => {
          setTaskStatus(result.statusText);
          setTaskProgress(result.progress);

          if (result.statusText === "completed") {
            updateNodeData(id, {
              videoUrl: result.resultUrl,
              previewVideoUrl: result.resultUrl,
              taskStatus: "completed",
              taskProgress: 100,
            });
            setIsGenerating(false);
          } else if (result.statusText === "failed") {
            updateNodeData(id, {
              taskStatus: "failed",
              errorMessage: result.errorMessage,
            });
            setIsGenerating(false);
          } else {
            startPolling(taskId);
          }
        })
        .catch((err) => {
          console.error("Resume poll error:", err);
          startPolling(taskId);
        });
    }
  }, [data.taskId, data.taskStatus, data.taskProgress, projectId, id, updateNodeData]);

  const incomingImages: IncomingImage[] = useMemo(() => {
    const nodeById = new Map(nodes.map((n) => [n.id, n] as const));
    const sourceNodeIds = edges
      .filter((e) => e.target === id)
      .map((e) => ({ edgeId: e.id, sourceId: e.source }));

    const images: IncomingImage[] = [];
    for (const { edgeId, sourceId } of sourceNodeIds) {
      const sourceNode = nodeById.get(sourceId);
      if (!sourceNode) continue;

      if (
        !isUploadNode(sourceNode) &&
        !isExportImageNode(sourceNode) &&
        !isImageEditNode(sourceNode)
      ) {
        continue;
      }

      const imageUrl = (sourceNode.data as { imageUrl?: string }).imageUrl;
      if (!imageUrl) continue;

      const previewImageUrl = (
        sourceNode.data as { previewImageUrl?: string | null }
      ).previewImageUrl;
      const displayName = (sourceNode.data as { displayName?: string })
        .displayName;

      images.push({
        id: edgeId,
        imageUrl,
        previewImageUrl: previewImageUrl ?? null,
        label: displayName || `图${images.length + 1}`,
        sourceNodeId: sourceId,
      });
    }

    return images;
  }, [edges, id, nodes, updateNodeData]);

  const handleRemoveImage = useCallback(
    (edgeId: string) => {
      deleteEdge(edgeId);
    },
    [deleteEdge],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) return;

      if (!projectId || !canvasId) {
        console.error("Missing projectId or canvasId");
        return;
      }
      try {
        const response = await canvasFileApi.upload(
          projectId,
          canvasId,
          id,
          file,
        );
        updateNodeData(id, {
          videoUrl: response.downloadUrl,
          previewVideoUrl: response.downloadUrl,
          sourceFileName: file.name,
          sourceType: 'upload',
          mode: 'upload',
        });
      } catch (error) {
        console.error("Failed to upload file:", error);
      } finally {
      }
    },
    [id, projectId, canvasId, updateNodeData],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("video/")) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
          }
        }
      }
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile],
  );

  const handlePreviewImage = useCallback(
    (imageUrl: string) => {
      openVideoViewer(imageUrl);
    },
    [openVideoViewer],
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false;
      updateNodeData(id, { prompt: e.currentTarget.value });
      e.currentTarget.style.height = "auto";
      e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
    },
    [id, updateNodeData],
  );

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isComposingRef.current) {
        return;
      }
      updateNodeData(id, { prompt: e.target.value });
      e.target.style.height = "auto";
      e.target.style.height = `${e.target.scrollHeight}px`;
    },
    [id, updateNodeData],
  );

  const startPolling = useCallback(
    (taskId: string) => {
      console.log("[VideoGenNode] startPolling called:", {
        projectId,
        taskId,
      });
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(async () => {
        try {
          console.log("[VideoGenNode] polling:", {
            projectId,
            taskId,
          });
          const result = await canvasTaskApi.poll(
            projectId || "default",
            taskId,
          );
          console.log(
            "[VideoGenNode] poll result:",
            result.statusText,
            result.progress,
          );
          setTaskStatus(result.statusText);
          setTaskProgress(result.progress);

          if (result.statusText === "completed") {
            updateNodeData(id, {
              videoUrl: result.resultUrl,
              previewVideoUrl: result.resultUrl,
              taskStatus: "completed",
              taskProgress: 100,
            });
            clearInterval(pollingIntervalRef.current!);
            setIsGenerating(false);
          } else if (result.statusText === "failed") {
            setError(result.errorMessage || "生成失败");
            updateNodeData(id, {
              taskStatus: "failed",
              errorMessage: result.errorMessage,
            });
            clearInterval(pollingIntervalRef.current!);
            setIsGenerating(false);
          } else if (result.statusText === "cancelled") {
            updateNodeData(id, {
              taskStatus: "cancelled",
            });
            clearInterval(pollingIntervalRef.current!);
            setIsGenerating(false);
          } else if (
            result.statusText === "processing" ||
            result.statusText === "pending"
          ) {
            updateNodeData(id, {
              taskStatus: result.statusText,
              taskProgress: result.progress,
            });
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, 30000);
    },
    [projectId, id, updateNodeData],
  );

  useEffect(() => {
    const taskId = data.taskId;
    if (
      taskId &&
      (data.taskStatus === "pending" || data.taskStatus === "processing")
    ) {
      setTaskStatus(data.taskStatus);
      setTaskProgress(data.taskProgress || 0);
      setIsGenerating(true);

      canvasTaskApi
        .poll(projectId || "default", taskId)
        .then((result) => {
          setTaskStatus(result.statusText);
          setTaskProgress(result.progress);

          if (result.statusText === "completed") {
            updateNodeData(id, {
              videoUrl: result.resultUrl,
              previewVideoUrl: result.resultUrl,
              taskStatus: "completed",
              taskProgress: 100,
            });
            setIsGenerating(false);
          } else if (result.statusText === "failed") {
            updateNodeData(id, {
              taskStatus: "failed",
              errorMessage: result.errorMessage,
            });
            setIsGenerating(false);
          } else {
            startPolling(taskId);
          }
        })
        .catch((err) => {
          console.error("Resume poll error:", err);
          startPolling(taskId);
        });
    }
  }, [data.taskId, data.taskStatus, data.taskProgress, projectId, id, updateNodeData, startPolling]);

  const getConnectedTextNodeContents = useCallback(() => {
    const incomingEdges = edges
      .filter((e) => e.target === id)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    const nodeById = new Map(nodes.map((n) => [n.id, n] as const));
    const contents: string[] = [];

    for (const edge of incomingEdges) {
      const sourceNode = nodeById.get(edge.source);
      if (!sourceNode) continue;

      if (sourceNode.type === CANVAS_NODE_TYPES.text) {
        const textData = sourceNode.data as TextNodeData;
        if (textData.content?.trim()) {
          contents.push(textData.content.trim());
        }
      }
    }

    return contents;
  }, [edges, id, nodes]);

  const handleGenerate = useCallback(async () => {
    const textNodeContents = getConnectedTextNodeContents();
    const mergedPrompt = [...textNodeContents, data.prompt]
      .filter(Boolean)
      .join("\n");

    if (!mergedPrompt.trim()) {
      setError("请输入提示词");
      return;
    }

    if (!projectId) {
      setError("项目ID无效，请刷新页面重试");
      return;
    }

    if (effectiveMode === 'undecided') {
      updateNodeData(id, { mode: 'prompt', sourceType: 'generated' });
    }

    console.log("[VideoGenNode] handleGenerate: setting isGenerating=true");
    setIsGenerating(true);
    setError(null);
    setTaskStatus("pending");
    setTaskProgress(0);

    try {
      let requestData: GenerateVideoRequest = {
        node_id: id,
        canvas_id:canvasId||"",
        prompt: mergedPrompt,
        model: data.aiModel,
        aspect_ratio: data.aspectRatio,
        fps: data.fps,
        duration: data.duration,
      };

      if (incomingImages.length > 0) {
        requestData.reference_files = incomingImages.map((img) => img.imageUrl);
      }

      const response = await videoApi.generateVideo(
        projectId || "",
        requestData,
      );

      console.log("[VideoGenNode] generate response:", {
        projectId,
        canvasId,
        nodeId: id,
        hasRequestId: !!response.task_id,
        requestId: response.task_id,
      });

      if (response.task_id) {
        setTaskStatus("processing");
        updateNodeData(id, {
          taskId: response.task_id,
          taskStatus: "processing",
        });
        startPolling(response.task_id);
      } else if (response.result_url) {
        updateNodeData(id, {
          videoUrl: response.result_url,
          previewVideoUrl: response.result_url,
        });

        setTaskStatus("processing");
        setTimeout(() => {
          setTaskStatus("completed");
          setIsGenerating(false);
        }, 1500);
      } else {
        setError("生成失败：未返回有效结果");
        setTaskStatus("failed");
        setIsGenerating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
      setTaskStatus("failed");
      updateNodeData(id, {
        taskStatus: "failed",
        errorMessage: err instanceof Error ? err.message : "生成失败",
      });
      setIsGenerating(false);
    }
  }, [
    canvasId,
    projectId,
    data.prompt,
    data.aiModel,
    data.aspectRatio,
    id,
    edges,
    nodes,
    incomingImages,
    updateNodeData,
    startPolling,
    getConnectedTextNodeContents,
  ]);

  const handleCancel = useCallback(async () => {
    console.log(
      "[handleCancel] called, data.taskId:",
      data.taskId,
      "isGenerating:",
      isGenerating,
    );
    setShowCancelConfirm(true);
  }, [data.taskId, isGenerating]);

  const handleConfirmCancel = useCallback(async () => {
    setShowCancelConfirm(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log("[handleCancel] cleared polling interval");
    }

    if (data.taskId) {
      try {
        console.log(
          "[handleCancel] calling cancel API with taskId:",
          data.taskId,
        );
        const result = await canvasTaskApi.cancel(
          projectId || "default",
          data.taskId,
        );
        console.log("[handleCancel] cancel API returned:", result);
        setIsGenerating(false);
        setTaskStatus(result.statusText);
        updateNodeData(id, {
          taskId: data.taskId,
          taskStatus: result.statusText,
        });
      } catch (err) {
        console.error("Cancel task error:", err);
        setIsGenerating(false);
        setTaskStatus("cancelled");
        updateNodeData(id, {
          taskId: undefined,
          taskStatus: "cancelled",
        });
      }
    } else {
      console.log("[handleCancel] no taskId, just resetting state");
      setIsGenerating(false);
      setTaskStatus("cancelled");
      updateNodeData(id, {
        taskId: undefined,
        taskStatus: "cancelled",
      });
    }
  }, [projectId, data.taskId, isGenerating, updateNodeData, id]);

  const handlePlayVideo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleClosePanel = useCallback(() => {
    setShowFloatingPanel(false);
  }, []);

  const handleVideoSelect = useCallback(
    (videoUrl: string) => {
      updateNodeData(id, { videoUrl, previewVideoUrl: videoUrl });
      setShowVideoSelector(false);
    },
    [id, updateNodeData],
  );

  const handleCloseImageSelector = useCallback(() => {
    setShowVideoSelector(false);
  }, []);

  
  const getVideoDuration = useCallback((): number => {
    return data.duration || 5;
  }, [data.duration]);

  const handleDownload = useCallback(() => {
    if (data.videoUrl) {
      downloadUrl(data.videoUrl, data.displayName || "video.mp4");
    }
  }, [data.videoUrl, data.displayName]);

  const handleDelete = useCallback(() => {
    deleteNode(id);
  }, [id, deleteNode]);

  return (
    <>
      <style>{pulseGlowStyles}</style>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileInput}
      />
      <NodeToolbar nodeId={id} visible={selected}>
        {effectiveMode === 'undecided' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="上传"
          >
            <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
        {effectiveMode === 'upload' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="替换"
          >
            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
        {effectiveMode === 'prompt' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowVideoSelector(true);
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="选择"
          >
            <Image className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (data.videoUrl) {
              openKeyframeModal(id, data.videoUrl, getVideoDuration());
            }
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="关键帧"
        >
          <Film className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openVideoViewer(data.videoUrl!);
          }}
          disabled={!data.videoUrl}
          className={`p-1.5 rounded ${data.videoUrl ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-40 cursor-not-allowed"}`}
          title="预览"
        >
          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          disabled={!data.videoUrl}
          className={`p-1.5 rounded ${data.videoUrl ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-40 cursor-not-allowed"}`}
          title="下载"
        >
          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
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
        className={`min-w-[200px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${
          selected ? "border-2 border-blue-500" : ""
        } shadow-md relative group`}
      >
        <div className="p-1.5 flex items-center justify-between">
          <EditableNodeTitle
            nodeType="视频"
            title={data.displayName || ""}
            onSave={(newTitle) => updateNodeData(id, { displayName: newTitle })}
            maxLength={50}
          />
          <div className="flex items-center gap-2">
            {(isGenerating ||
              taskStatus === "pending" ||
              taskStatus === "processing") && (
              <div className="flex items-center gap-2">
                {taskStatus === "pending" && (
                  <span className="text-xs text-yellow-500">等待中...</span>
                )}
                {taskStatus === "processing" && (
                  <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse">
                    生成中...
                  </span>
                )}
                {isGenerating && taskStatus === "idle" && (
                  <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse">
                    生成中...
                  </span>
                )}
                {taskProgress > 0 && taskStatus === "processing" && (
                  <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 dark:bg-blue-400 transition-all"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            {taskStatus === "failed" && (
              <span className="text-xs text-red-500 dark:text-red-400">失败</span>
            )}
          </div>
        </div>

        <div
          ref={resultRef}
          className={`relative h-40 p-1.5 cursor-pointer ${
            isGenerating || taskStatus === "pending" || taskStatus === "processing" ? "preview-glow" : ""
          }`}
          onClick={() => setShowFloatingPanel(true)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
        >
          {data.videoUrl ? (
            <div className="h-full relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-600">
              <video
                ref={videoRef}
                src={data.previewVideoUrl || data.videoUrl}
                className="w-full h-full object-contain"
                muted
                preload="auto"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                <button
                  type="button"
                  onClick={handlePlayVideo}
                  className="opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-gray-50 dark:from-gray-700 to-gray-100 dark:to-gray-600">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 dark:from-blue-900/40 to-purple-100 dark:to-purple-900/40 flex items-center justify-center">
                <Film className="w-8 h-8 text-blue-500" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-3"></span>
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">点击打开创作面板</span>
            </div>
          )}
        </div>

        {(effectiveMode === 'undecided' || effectiveMode === 'prompt') && showFloatingPanel && (
          <div
            ref={panelRef}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[600px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl z-50"
          >
            <div className="overflow-y-auto relative">
              <button
                type="button"
                onClick={handleClosePanel}
                className="absolute right-2 top-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded z-10"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="p-1.5">
                {incomingImages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {incomingImages.map((img, index) => (
                      <div key={`${img.id}-${index}`} className="relative group">
                        <img
                          src={img.previewImageUrl || img.imageUrl}
                          alt={img.label}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                          onClick={() => handlePreviewImage(img.imageUrl)}
                        />
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center z-10">
                          {index + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          title="断开连接"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-12 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 dark:text-gray-500 text-xs">
                    暂无参考图片（拖拽连接上游节点）
                  </div>
                )}
              </div>

              <div className="p-1.5">
                <NodeTextarea
                  ref={promptTextareaRef}
                  placeholder="描述你想要的视频..."
                  defaultValue={data.prompt || ""}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  onChange={handlePromptChange}
                  style={{
                    height: data.prompt ? "auto" : "60px",
                    minHeight: "60px",
                  }}
                />
              </div>

              <div className="p-1.5 flex items-center gap-2 flex-wrap">
                <select
                  className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={data.aiModel || "veo"}
                  onChange={(e) =>
                    updateNodeData(id, {
                      aiModel: e.target.value,
                    })
                  }
                >
                  {availableAIModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>

                <VideoSettingCard
                  aspectRatioValue={data.aspectRatio || "16:9"}
                  aspectRatioOptions={ASPECT_RATIOS}
                  onAspectRatioChange={(value) =>
                    updateNodeData(id, { aspectRatio: value })
                  }
                  resolutionValue={data.resolution || "1080p"}
                  resolutionOptions={RESOLUTION_OPTIONS}
                  onResolutionChange={(value) =>
                    updateNodeData(id, {
                      resolution: value as VideoResolution,
                    })
                  }
                  durationValue={String(data.duration) || "5"}
                  durationOptions={DURATION_OPTIONS}
                  onDurationChange={(value) =>
                    updateNodeData(id, { duration: value })
                  }
                />

                <button
                  type="button"
                  onClick={() => openTextNodeOrderModal(id)}
                  className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  调整顺序
                </button>

                <button
                  className={`ml-auto px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    isGenerating
                      ? "bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700"
                      : "bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700"
                  }`}
                  onClick={isGenerating ? handleCancel : handleGenerate}
                >
                  {isGenerating ? "取消" : "生成"}
                </button>
              </div>

              {error && (
                <div className="p-1.5">
                  <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">
                    {error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Handle
          type="target"
          position={Position.Left}
          id="target"
          className="w-3 h-3"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          className="w-3 h-3"
        />
        {showVideoSelector && projectId && (
          <VideoSelectorModal
            projectId={projectId}
            nodeId={id}
            currentVideoUrl={data.videoUrl || null}
            onSelect={handleVideoSelect}
            onClose={handleCloseImageSelector}
          />
        )}

      </div>
      <ConfirmDialog
        open={showCancelConfirm}
        title="确认取消"
        message="确定要取消正在生成的任务吗？"
        confirmText="确定"
        confirmType="danger"
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
});