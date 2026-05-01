import { memo, useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Eye, X, Download, Trash2, Image } from "lucide-react";
import {
  ImageEditNodeData,
  ImageEditAIModel,
  ImageEditTaskStatus,
  isUploadNode,
  isExportImageNode,
  isImageEditNode,
  IMAGE_ASPECT_RATIOS,
} from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { imageApi, type ImageAiModel } from "../../../api/imageApi";
import { canvasTaskApi } from "../../../api/canvasTaskApi";
import { ImageSelectorModal } from "../ui/ImageSelectorModal";
import { downloadUrl } from "../domain/downloadUtils";
import { NodeToolbar } from "../ui/NodeToolbar";

const IMAGE_SIZES = [
  { value: "1024", label: "1K" },
  { value: "2048", label: "2K" },
  { value: "4096", label: "4K" },
  { value: "8192", label: "8K" },
];

const ASPECT_RATIOS = IMAGE_ASPECT_RATIOS.map((ratio) => ({
  value: ratio,
  label: ratio,
}));

interface IncomingImage {
  id: string;
  imageUrl: string;
  previewImageUrl?: string | null;
  label: string;
  sourceNodeId: string;
}

export const ImageEditNode = memo(function ImageEditNode({
  id,
  data,
  selected,
}: NodeProps & { data: ImageEditNodeData }) {
  const { canvasId } = useParams<{ canvasId: string }>();
  const projectId = useCanvasStore((s) => s.projectId);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const addDerivedExportNode = useCanvasStore((s) => s.addDerivedExportNode);
  const addEdge = useCanvasStore((s) => s.addEdge);
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);
  const openImageViewer = useCanvasStore((s) => s.openImageViewer);
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [availableAIModels, setAvailableAIModels] = useState<ImageAiModel[]>([]);
  const [taskStatus, setTaskStatus] = useState<ImageEditTaskStatus>(
    data.taskStatus || "idle",
  );
  const [taskProgress, setTaskProgress] = useState(data.taskProgress || 0);
  const [nodeFileCount, setNodeFileCount] = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
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
      if (
        showFloatingPanel &&
        panelRef.current &&
        resultRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !resultRef.current.contains(event.target as Node)
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
      imageApi.getModels(projectId || "default").then((models) => {
        setAvailableAIModels(models);
        if (!models.some((m) => m.id === data.aiModel)) {
          updateNodeData(id, { aiModel: models[0]?.id || "dall-e-2" });
        }
      });
    }
  }, [showFloatingPanel, projectId]);

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
              imageUrl: result.resultUrl,
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
  }, []);

  useEffect(() => {
    if (!projectId || !id) return;

    canvasTaskApi
      .getNodeTaskImagesCount(projectId, id)
      .then((count) => setNodeFileCount(count))
      .catch((err) => {
        console.error("Failed to get node task images count:", err);
      });
  }, [projectId, id]);

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
  }, [edges, id, nodes]);

  const handleRemoveImage = useCallback(
    (edgeId: string) => {
      deleteEdge(edgeId);
    },
    [deleteEdge],
  );

  const handlePreviewImage = useCallback(
    (imageUrl: string) => {
      openImageViewer(imageUrl);
    },
    [openImageViewer],
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
      console.log("[ImageEditNode] startPolling called:", {
        projectId,
        taskId,
      });
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(async () => {
        try {
          console.log("[ImageEditNode] polling:", {
            projectId,
            taskId,
          });
          const result = await canvasTaskApi.poll(
            projectId || "default",
            taskId,
          );
          console.log(
            "[ImageEditNode] poll result:",
            result.statusText,
            result.progress,
          );
          setTaskStatus(result.statusText);
          setTaskProgress(result.progress);

          if (result.statusText === "completed") {
            updateNodeData(id, {
              imageUrl: result.resultUrl,
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

  const handleGenerate = useCallback(async () => {
    if (!data.prompt?.trim()) {
      setError("请输入提示词");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setTaskStatus("pending");
    setTaskProgress(0);

    try {
      const sizeValue = data.size || "1K";
      const aspectRatio = data.requestAspectRatio || "1:1";

      let apiSize: "1K" | "2K" | "4K" = "2K";
      if (sizeValue === "1K") apiSize = "1K";
      else if (sizeValue === "2K") apiSize = "2K";
      else if (sizeValue === "4K") apiSize = "4K";
      else if (sizeValue === "8K") apiSize = "4K";

      const requestData: Parameters<typeof imageApi.generate>[1] = {
        prompt: data.prompt,
        model: data.aiModel,
        size: apiSize,
        aspectRatio,
        nodeId: id,
        canvasId: canvasId || "",
      };

      if (incomingImages.length > 0) {
        requestData.referenceImages = incomingImages.map((img) => img.imageUrl);
      }

      const response = await imageApi.generate(
        projectId || "default",
        requestData,
      );

      console.log("[ImageEditNode] generate response:", {
        projectId,
        canvasId,
        nodeId: id,
        hasTaskId: !!response.taskId,
        taskId: response.taskId,
      });

      if (response.taskId) {
        setTaskStatus("processing");
        updateNodeData(id, {
          taskId: response.taskId,
          taskStatus: "processing",
        });
        startPolling(response.taskId);
      } else {
        setTaskStatus("completed");
        updateNodeData(id, {
          imageUrl: response.imageUrl,
          taskStatus: "completed",
        });

        const createdNodeId = addDerivedExportNode(
          id,
          response.imageUrl,
          response.aspectRatio,
          response.imageUrl,
          {
            defaultTitle: "AI 生成",
            resultKind: "generic",
          },
        );

        if (createdNodeId) {
          addEdge(id, createdNodeId);
        }
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
    data.workMode,
    data.size,
    data.requestAspectRatio,
    id,
    addDerivedExportNode,
    addEdge,
    incomingImages,
    updateNodeData,
    startPolling,
  ]);

  const handleCancel = useCallback(async () => {
    console.log(
      "[handleCancel] called, data.taskId:",
      data.taskId,
      "isGenerating:",
      isGenerating,
    );
    if (!window.confirm("确定要取消正在生成的任务吗？")) {
      console.log("[handleCancel] user cancelled confirm");
      return;
    }

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

  const handleResultClick = useCallback(() => {
    setShowFloatingPanel((prev) => !prev);
  }, []);

  const handleClosePanel = useCallback(() => {
    setShowFloatingPanel(false);
  }, []);

  const handleImageSelect = useCallback(
    (imageUrl: string) => {
      updateNodeData(id, { imageUrl });
      setShowImageSelector(false);
    },
    [id, updateNodeData],
  );

  const handleCloseImageSelector = useCallback(() => {
    setShowImageSelector(false);
  }, []);

  const handleDownload = useCallback(() => {
    if (data.imageUrl) {
      downloadUrl(data.imageUrl, data.displayName || "image.jpg");
    }
  }, [data.imageUrl, data.displayName]);

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
            setShowImageSelector(true);
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="选择"
        >
          <Image className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openImageViewer(data.imageUrl!);
          }}
          disabled={!data.imageUrl}
          className={`p-1.5 rounded ${data.imageUrl ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-40 cursor-not-allowed"}`}
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
          disabled={!data.imageUrl}
          className={`p-1.5 rounded ${data.imageUrl ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-40 cursor-not-allowed"}`}
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
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {data.displayName || "图片生成"}
          </span>
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
        className="h-40 p-1.5 cursor-pointer"
        onClick={handleResultClick}
      >
        {data.imageUrl ? (
          imageLoadError ? (
            <div className="h-full flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-red-50 dark:from-red-900/20 to-red-100 dark:to-red-900/30">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 dark:from-red-900/40 to-red-200 dark:to-red-900/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-sm text-red-600 dark:text-red-400 font-medium mt-3">图片加载失败</span>
            </div>
          ) : (
            <div className="h-full relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-600">
              <img
                src={data.previewImageUrl || data.imageUrl}
                alt=""
                className="w-full h-full object-contain"
                onError={() => setImageLoadError(true)}
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <Eye className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-gray-50 dark:from-gray-700 to-gray-100 dark:to-gray-600">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 dark:from-blue-900/40 to-purple-100 dark:from-purple-900/40 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-3">等待生成图片</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">点击编辑参数开始创作</span>
          </div>
        )}

        {nodeFileCount > 0 && (
          <div
            className="absolute bottom-1 right-1 text-gray-400 dark:text-gray-500 text-[10px] hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowImageSelector(true);
            }}
          >
            {nodeFileCount}张
          </div>
        )}
      </div>

      {showFloatingPanel && (
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
              <textarea
                ref={promptTextareaRef}
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded p-2 overflow-hidden bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="描述你想要的图片..."
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

            <div className="p-1.5 flex items-center gap-2">
              <select
                className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={data.aiModel || "dall-e-2"}
                onChange={(e) =>
                  updateNodeData(id, {
                    aiModel: e.target.value as ImageEditAIModel,
                  })
                }
              >
                {availableAIModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>

              <select
                className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={data.size || "1024"}
                onChange={(e) =>
                  updateNodeData(id, {
                    size: e.target.value as "1024" | "2048" | "4096" | "8192",
                  })
                }
              >
                {IMAGE_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={data.requestAspectRatio || "16:9"}
                onChange={(e) =>
                  updateNodeData(id, { requestAspectRatio: e.target.value })
                }
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>

              <button
                className={`ml-auto px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isGenerating
                    ? "bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700"
                    : "bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700"
                }`}
                onClick={isGenerating ? handleCancel : handleGenerate}
              >
                {isGenerating ? "取消" : "生成图片"}
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
      {showImageSelector && projectId && (
        <ImageSelectorModal
          projectId={projectId}
          nodeId={id}
          currentImageUrl={data.imageUrl || null}
          onSelect={handleImageSelect}
          onClose={handleCloseImageSelector}
        />
      )}
    </div>
    </>
  );
});
