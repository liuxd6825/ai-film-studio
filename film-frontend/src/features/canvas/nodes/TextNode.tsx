import { memo, useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Trash2, Type, Sparkles, Image, Video, Volume } from "lucide-react";
import {
  TextNodeData,
  CANVAS_NODE_TYPES,
} from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { llmApi, type LLMModel } from "../../../api/llmApi";
import { NodeToolbar } from "../ui/NodeToolbar";

const MAX_PREVIEW_LENGTH = 100;

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

export const TextNode = memo(function TextNode({
  id,
  data,
  selected,
}: NodeProps & { data: TextNodeData }) {
  const { canvasId } = useParams<{ canvasId: string }>();
  const projectId = useCanvasStore((s) => s.projectId);
  const addNode = useCanvasStore((s) => s.addNode);
  const addEdge = useCanvasStore((s) => s.addEdge);
  const findNodePosition = useCanvasStore((s) => s.findNodePosition);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<"idle" | "pending" | "processing" | "completed" | "failed" | "cancelled">("idle");
  const [taskProgress, setTaskProgress] = useState(0);
  const [availableAIModels, setAvailableAIModels] = useState<LLMModel[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (selected) {
      setShowFloatingPanel(true);
    } else {
      setShowFloatingPanel(false);
      setIsEditing(false);
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
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

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
      llmApi.getModels(projectId || "default").then((models) => {
        setAvailableAIModels(models);
        if (!models.some((m) => m.id === data.aiModel)) {
          updateNodeData(id, { aiModel: models[0]?.id || "veo" });
        }
      });
    }
  }, [showFloatingPanel]);

  const handleResultClick = useCallback(() => {
    setShowFloatingPanel((prev) => !prev);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setShowFloatingPanel(false);
  }, []);

  const handleClosePanel = useCallback(() => {
    setShowFloatingPanel(false);
  }, []);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false;
      updateNodeData(id, { content: e.currentTarget.value });
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

  const handleInlineContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isComposingRef.current) {
        return;
      }
      updateNodeData(id, { content: e.target.value });
    },
    [id, updateNodeData],
  );

  const handleInlineCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false;
      updateNodeData(id, { content: e.currentTarget.value });
    },
    [id, updateNodeData],
  );

  const handleFinishEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        setIsEditing(false);
      }
    },
    [],
  );

  const handleDelete = useCallback(() => {
    deleteNode(id);
  }, [id, deleteNode]);

  const handleAIPromptGenerate = useCallback(() => {
    const newPosition = findNodePosition(id, 300, 200);
    const newNodeId = addNode(CANVAS_NODE_TYPES.text, newPosition);
    if (newNodeId) {
      addEdge(id, newNodeId);
    }
  }, [id, addNode, addEdge, findNodePosition]);

  const handleImageGenerate = useCallback(() => {
    const newPosition = findNodePosition(id, 300, 200);
    const newNodeId = addNode(CANVAS_NODE_TYPES.imageEdit, newPosition);
    if (newNodeId) {
      addEdge(id, newNodeId);
    }
  }, [id, addNode, addEdge, findNodePosition]);

  const handleVideoGenerate = useCallback(() => {
    const newPosition = findNodePosition(id, 300, 200);
    const newNodeId = addNode(CANVAS_NODE_TYPES.videoGen, newPosition);
    if (newNodeId) {
      addEdge(id, newNodeId);
    }
  }, [id, addNode, addEdge, findNodePosition]);

  const handleGenerate = useCallback(async () => {
    if (!projectId) {
      setError("项目ID无效，请刷新页面重试");
      return;
    }

    if (!data.prompt?.trim()) {
      setError("请输入提示词");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setTaskStatus("pending");
    setTaskProgress(0);

    try {
      debugger
      setTaskStatus("processing");
      const result = await llmApi.generate(projectId, {
        canvasId: canvasId || "",
        nodeId: id,
        prompt: data.prompt,
        model: data.aiModel,
      });
      updateNodeData(id, { content: result });
      setTaskStatus("completed");
      setTaskProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
      setTaskStatus("failed");
    } finally {
      setIsGenerating(false);
    }
  }, [projectId, canvasId, id, data.prompt, data.aiModel, updateNodeData]);

  const handleCancel = useCallback(() => {
    if (!window.confirm("确定要取消正在生成的任务吗？")) {
      return;
    }
    setIsGenerating(false);
    setTaskStatus("cancelled");
  }, []);

  const truncateText = (text: unknown, maxLength: number): string => {
    if (!text || typeof text !== "string") return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <>
      <style>{pulseGlowStyles}</style>
      <NodeToolbar nodeId={id} visible={selected}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAIPromptGenerate();
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="AI提示词生成"
        >
          <Sparkles className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleImageGenerate();
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="图片生成"
        >
          <Image className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleVideoGenerate();
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="视频生成"
        >
          <Video className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="音频生成"
        >
          <Volume className="w-4 h-4 text-gray-600 dark:text-gray-400" />
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
        className={`min-w-[300px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${selected ? "border-2 border-blue-500" : ""
          } shadow-md relative group`}
      >
        <div className="p-1.5 flex items-center justify-between">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {data.displayName || "文本"}
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

        {isEditing ? (
          <div className="p-1.5">
            <textarea
              ref={textareaRef}
              className="w-full min-h-[120px] text-sm border border-gray-200 dark:border-gray-600 rounded p-2 overflow-hidden bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={data.content || ""}
              onChange={handleInlineContentChange}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleInlineCompositionEnd}
              onKeyDown={handleKeyDown}
              onBlur={handleFinishEditing}
              onClick={(e) => {
                e.currentTarget.selectionStart = e.currentTarget.selectionEnd;
              }}
              style={{
                height: "auto",
                minHeight: "80px",
              }}
            />
          </div>
        ) : (
          <div
            ref={resultRef}
            className={`relative min-h-[100px] p-1.5 cursor-pointer ${
              isGenerating || taskStatus === "pending" || taskStatus === "processing" ? "preview-glow" : ""
            }`}
            onClick={handleResultClick}
            onDoubleClick={handleDoubleClick}
          >
            {data.content ? (
              <div className="h-full min-h-[100px] rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 dark:from-gray-700 to-gray-100 dark:to-gray-600 p-2">
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                  {truncateText(data.content, MAX_PREVIEW_LENGTH)}
                </p>
              </div>
            ) : (
              <div className="h-full min-h-[100px] flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-gray-50 dark:from-gray-700 to-gray-100 dark:to-gray-600">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 dark:from-blue-900/40 to-purple-100 dark:to-purple-900/40 flex items-center justify-center">
                  <Type className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-2">点击或双击编辑</span>
              </div>
            )}
          </div>
        )}

        {showFloatingPanel && !isEditing && (
          <div
            ref={panelRef}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[600px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl z-50"
          >
            <div className="overflow-y-auto relative">

              <div className="p-1.5">
                <textarea
                  ref={textareaRef}
                  className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded p-2 overflow-hidden bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="描述你想要生成的内容..."
                  defaultValue={data.prompt || ""}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  onChange={handlePromptChange}
                  style={{
                    height: data.prompt ? "auto" : "80px",
                    minHeight: "80px",
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

              <div className="p-1.5">
                {error && (
                  <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">
                    {error}
                  </div>
                )}
              </div>
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
      </div>
    </>
  );
});