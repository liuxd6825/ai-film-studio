import { memo, useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play, Pause, Download, Trash2, Upload, X } from "lucide-react";
import { AudioNodeData, AudioTaskStatus } from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { audioApi, type AudioModel, type Voice } from "../api/audioApi";
import { canvasFileApi } from "../../../api/canvasFileApi";
import { canvasTaskApi } from "../../../api/canvasTaskApi";
import { downloadUrl } from "../domain/downloadUtils";
import { NodeToolbar } from "../ui/NodeToolbar";
import { EditableNodeTitle } from "../components/EditableNodeTitle";
import { ConfirmDialog } from "../ui/ConfirmDialog";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AudioNode = memo(function AudioNode({
  id,
  data,
  selected,
}: NodeProps & { data: AudioNodeData }) {
  const { canvasId } = useParams<{ canvasId: string }>();
  const projectId = useCanvasStore((s) => s.projectId);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const openContentEditor = useCanvasStore((s) => s.openContentEditor);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [availableAIModels, setAvailableAIModels] = useState<AudioModel[]>([]);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [taskStatus, setTaskStatus] = useState<AudioTaskStatus>(data.taskStatus || "idle");
  const [taskProgress, setTaskProgress] = useState(data.taskProgress || 0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isComposingRef = useRef(false);

  const effectiveMode = data.mode || 'prompt';

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
    if (showFloatingPanel && data.prompt && promptTextareaRef.current) {
      promptTextareaRef.current.style.height = "auto";
      promptTextareaRef.current.style.height = `${promptTextareaRef.current.scrollHeight}px`;
    }
  }, [showFloatingPanel, data.prompt]);

  useEffect(() => {
    if (showFloatingPanel) {
      audioApi.getModels(projectId || "default").then((models) => {
        setAvailableAIModels(models);
      });
      audioApi.getVoices(projectId || "default").then((voices) => {
        setAvailableVoices(voices);
      });
    }
  }, [showFloatingPanel, projectId]);

  const startPolling = useCallback(
    (taskId: string) => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(async () => {
        try {
          const result = await canvasTaskApi.poll(projectId || "default", taskId);
          setTaskStatus(result.statusText as AudioTaskStatus);
          setTaskProgress(result.progress);

          if (result.statusText === "completed") {
            updateNodeData(id, {
              audioUrl: result.resultUrl,
              previewAudioUrl: result.resultUrl,
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
            updateNodeData(id, { taskStatus: "cancelled" });
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
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const taskId = data.taskId;
    if (taskId && (data.taskStatus === "pending" || data.taskStatus === "processing")) {
      setTaskStatus(data.taskStatus);
      setTaskProgress(data.taskProgress || 0);
      setIsGenerating(true);
      startPolling(taskId);
    }
  }, [id, projectId, data.taskId, data.taskStatus, data.taskProgress, startPolling]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("audio/")) return;

      if (!projectId || !canvasId) {
        console.error("Missing projectId or canvasId");
        return;
      }

      setIsUploading(true);
      try {
        const response = await canvasFileApi.upload(
          projectId,
          canvasId,
          id,
          file,
        );
        updateNodeData(id, {
          audioUrl: response.downloadUrl,
          previewAudioUrl: response.downloadUrl,
          sourceFileName: file.name,
          fileSize: file.size,
          mode: "upload",
        });
      } catch (error) {
        console.error("Failed to upload file:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [id, projectId, canvasId, updateNodeData],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

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
        if (item.type.startsWith("audio/")) {
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

  const handlePreview = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (data.audioUrl) {
        const ext = data.sourceFileName?.split(".").pop() || "mp3";
        downloadUrl(data.audioUrl, data.sourceFileName || `audio.${ext}`);
      }
    },
    [data.audioUrl, data.sourceFileName],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteNode(id);
    },
    [id, deleteNode],
  );

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (effectiveMode === 'prompt') {
      openContentEditor(id, data.content || "");
    }
  }, [effectiveMode, id, data.content, openContentEditor]);

  const handleClosePanel = useCallback(() => {
    setShowFloatingPanel(false);
  }, []);

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

  const handleGenerate = useCallback(async () => {
    if (!projectId || !canvasId) {
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

    let task: Awaited<ReturnType<typeof audioApi.generate>> | undefined;
    try {
      const requestData = {
        canvasId: canvasId || "",
        nodeId: id,
        prompt: data.prompt,
        model: data.aiModel || "veo",
        voice: data.voice || "default",
      };

      task = await audioApi.generate(projectId, requestData);

      if (task.id) {
        setTaskStatus("processing");
        updateNodeData(id, {
          taskId: task.id,
          taskStatus: "processing",
        });
        startPolling(task.id);
      } else {
        setError("任务创建失败：未获取到任务ID");
        setTaskStatus("failed");
        setIsGenerating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
      setTaskStatus("failed");
      setIsGenerating(false);
    } finally {
      if (!task?.id) {
        setIsGenerating(false);
      }
    }
  }, [projectId, canvasId, id, data.prompt, data.aiModel, data.voice, updateNodeData, startPolling]);

  const handleCancel = useCallback(() => {
    setShowCancelConfirm(true);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    setShowCancelConfirm(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (data.taskId) {
      try {
        await canvasTaskApi.cancel(projectId || "default", data.taskId);
        setIsGenerating(false);
        setTaskStatus("cancelled");
        updateNodeData(id, {
          taskId: undefined,
          taskStatus: "cancelled",
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
      setIsGenerating(false);
      setTaskStatus("cancelled");
      updateNodeData(id, {
        taskId: undefined,
        taskStatus: "cancelled",
      });
    }
  }, [projectId, data.taskId, updateNodeData, id]);

  return (
    <>
      <NodeToolbar nodeId={id} visible={selected && !isGenerating}>
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
        <button
          type="button"
          onClick={handlePreview}
          disabled={!data.audioUrl}
          className={`p-1.5 rounded ${data.audioUrl && !isGenerating ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-40 cursor-not-allowed"}`}
          title="播放"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!data.audioUrl}
          className={`p-1.5 rounded ${data.audioUrl && !isGenerating ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-40 cursor-not-allowed"}`}
          title="下载"
        >
          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isGenerating}
          className={`p-1.5 rounded ${!isGenerating ? "hover:bg-red-100 dark:hover:bg-red-900/30" : "opacity-40 cursor-not-allowed"}`}
          title="删除"
        >
          <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
        </button>
      </NodeToolbar>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/wav,audio/ogg,audio/*"
        className="hidden"
        onChange={handleFileInput}
      />
      {data.audioUrl && (
        <audio
          ref={audioRef}
          src={data.previewAudioUrl || data.audioUrl}
          onEnded={handleAudioEnded}
        />
      )}
      <div
        className={`min-w-[200px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${
          selected ? "border-2 border-blue-500" : ""
        } relative group`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onDoubleClick={handleDoubleClick}
      >
        <div className="p-1.5 flex items-center justify-between">
          <EditableNodeTitle
            nodeType="音频"
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
          className="h-24 p-1.5 cursor-pointer"
          onClick={() => setShowFloatingPanel(true)}
        >
          {data.audioUrl ? (
            <div className="h-full flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-50 dark:from-purple-900/20 to-blue-50 dark:to-blue-900/20">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${isPlaying ? "bg-blue-500" : "bg-gray-400"}`}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" onClick={handlePreview} />
                  ) : (
                    <Play className="w-5 h-5 text-white fill-white" onClick={handlePreview} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                    {data.sourceFileName || "audio"}
                  </span>
                  {data.fileSize && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(data.fileSize)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : isUploading ? (
            <div className="h-full flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-blue-100 dark:to-blue-900/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 dark:from-blue-900/40 to-blue-200 dark:to-blue-900/50 flex items-center justify-center animate-pulse">
                <Upload className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-2">上传中...</span>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-gray-50 dark:from-gray-700 to-gray-100 dark:to-gray-600">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 dark:from-purple-900/40 to-blue-100 dark:to-blue-900/40 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-2">
                {isDragOver ? "松开上传" : "拖拽、粘贴或点击上传"}
              </span>
            </div>
          )}
        </div>

        {effectiveMode === 'prompt' && showFloatingPanel && (
          <div
            ref={panelRef}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[500px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl z-50"
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
                <textarea
                  ref={promptTextareaRef}
                  placeholder="描述你想要生成的音频内容..."
                  defaultValue={data.prompt || ""}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  onChange={handlePromptChange}
                  className="w-full min-h-[80px] p-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ height: data.prompt ? "auto" : "80px" }}
                />
              </div>

              <div className="p-1.5 flex items-center gap-2">
                <select
                  className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={data.aiModel || "veo"}
                  onChange={(e) =>
                    updateNodeData(id, { aiModel: e.target.value })
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
                  value={data.voice || "default"}
                  onChange={(e) =>
                    updateNodeData(id, { voice: e.target.value })
                  }
                >
                  {availableVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
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