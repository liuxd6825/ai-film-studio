import { memo, useCallback, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play, Eye, Film, Download, Trash2 } from "lucide-react";
import { VideoUploadNodeData } from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { canvasFileApi } from "../../../api/canvasFileApi";
import { KeyframeModal } from "../ui/KeyframeModal";
import { downloadUrl } from "../domain/downloadUtils";
import { NodeToolbar } from "../ui/NodeToolbar";

interface VideoNodeData extends VideoUploadNodeData {
  onVideoChange?: (
    nodeId: string,
    videoUrl: string,
    previewUrl?: string,
  ) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function extractVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = videoUrl;
    video.currentTime = 0;
    video.muted = true;
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    video.onerror = () => reject(new Error("Failed to load video"));
  });
}

export const VideoNode = memo(function VideoNode({
  id,
  data,
  selected,
}: NodeProps & { data: VideoNodeData }) {
  const { canvasId } = useParams<{ canvasId: string }>();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showKeyframeModal, setShowKeyframeModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectId = useCanvasStore((state) => state.projectId);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const openImageViewer = useCanvasStore((state) => state.openImageViewer);
  const addKeyframe = useCanvasStore((state) => state.addKeyframe);
  const deleteNode = useCanvasStore((state) => state.deleteNode);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) return;

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

        const previewUrl = await extractVideoThumbnail(response.downloadUrl);

        updateNodeData(id, {
          videoUrl: response.downloadUrl,
          previewVideoUrl: previewUrl,
          sourceFileName: file.name,
          fileSize: file.size,
          duration: undefined,
          width: undefined,
          height: undefined,
          frameRate: undefined,
        });
      } catch (error) {
        console.error("Failed to upload file:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [id, projectId, canvasId, updateNodeData],
  );

  const handleVideoMetadata = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      updateNodeData(id, {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    },
    [id, updateNodeData],
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

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
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

  const handlePreview = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (data.videoUrl) {
        openImageViewer(data.videoUrl);
      }
    },
    [data.videoUrl, openImageViewer],
  );

  const handleOpenKeyframeModal = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowKeyframeModal(true);
    },
    [],
  );

  const handleExtractKeyframe = useCallback(
    (timestamp: number, imageUrl: string, width?: number, height?: number) => {
      if (data.videoUrl) {
        addKeyframe(id, timestamp, imageUrl, data.videoUrl, width, height);
      }
    },
    [id, data.videoUrl, addKeyframe],
  );

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (data.videoUrl) {
        downloadUrl(data.videoUrl, data.sourceFileName || "video.mp4");
      }
    },
    [data.videoUrl, data.sourceFileName],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteNode(id);
    },
    [id, deleteNode],
  );

  const showMediaInfo = data.width && data.height && data.duration;

  return (
    <>
      <NodeToolbar nodeId={id} visible={selected}>
        <button
          type="button"
          onClick={handleOpenKeyframeModal}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="关键帧"
        >
          <Film className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={handlePreview}
          disabled={!data.videoUrl}
          className={`p-1.5 rounded ${data.videoUrl ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-40 cursor-not-allowed"}`}
          title="预览"
        >
          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!data.videoUrl}
          className={`p-1.5 rounded ${data.videoUrl ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-40 cursor-not-allowed"}`}
          title="下载"
        >
          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          title="删除"
        >
          <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
        </button>
      </NodeToolbar>
      <div
        className={`min-w-[200px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${
          selected ? "border-2 border-blue-500" : ""
        } shadow-md group`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {data.displayName || "视频"}
          </span>
          {data.sourceFileName && (
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px]">
              {data.sourceFileName}
            </span>
          )}
        </div>
        <div className="h-40 p-3 flex items-center justify-center" onClick={handleClick}>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileInput}
          />
          {data.videoUrl ? (
            <div className="h-40 relative cursor-pointer">
              <video
                src={data.videoUrl}
                className="w-full h-full object-contain rounded"
                onLoadedMetadata={handleVideoMetadata}
                muted
                preload="metadata"
              />
              <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
            </div>
          ) : (
            <div
              className={`h-32 w-full flex items-center justify-center border-2 border-dashed rounded text-gray-400 dark:text-gray-500 text-sm transition-colors ${
                isDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600"
              }`}
            >
              {isUploading
                ? "上传中..."
                : isDragOver
                  ? "松开上传"
                  : "拖驾、粘贴或点击上传"}
            </div>
          )}
        </div>
        {showMediaInfo && (
          <div className="px-3 pb-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>⏱ {formatDuration(data.duration!)}</span>
            <span>📐 {data.width}x{data.height}</span>
            {data.fileSize && <span>💾 {formatFileSize(data.fileSize)}</span>}
          </div>
        )}
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          className="w-3 h-3"
        />
      </div>
      {showKeyframeModal && data.videoUrl && data.duration && (
        <KeyframeModal
          nodeId={id}
          videoUrl={data.videoUrl}
          duration={data.duration}
          onClose={() => setShowKeyframeModal(false)}
          onExtract={handleExtractKeyframe}
        />
      )}
    </>
  );
});
