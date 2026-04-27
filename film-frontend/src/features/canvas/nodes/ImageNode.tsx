import { memo, useCallback, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Eye, Download, Trash2, Upload } from "lucide-react";
import { UploadImageNodeData } from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { canvasFileApi } from "../../../api/canvasFileApi";
import { downloadUrl } from "../domain/downloadUtils";
import { NodeToolbar } from "../ui/NodeToolbar";

interface ImageNodeData extends UploadImageNodeData {
  onImageChange?: (
    nodeId: string,
    imageUrl: string,
    previewUrl?: string,
  ) => void;
}

export const ImageNode = memo(function ImageNode({
  id,
  data,
  selected,
}: NodeProps & { data: ImageNodeData }) {
  const { canvasId } = useParams<{ canvasId: string }>();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectId = useCanvasStore((state) => state.projectId);
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);
  const openImageViewer = useCanvasStore((state) => state.openImageViewer);
  const deleteNode = useCanvasStore((state) => state.deleteNode);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;

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
          imageUrl: response.downloadUrl,
          previewImageUrl: response.downloadUrl,
          sourceFileName: file.name,
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
        if (item.type.startsWith("image/")) {
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
      if (data.imageUrl) {
        openImageViewer(data.imageUrl);
      }
    },
    [data.imageUrl, openImageViewer],
  );

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (data.imageUrl) {
        downloadUrl(data.imageUrl, data.sourceFileName || "image.jpg");
      }
    },
    [data.imageUrl, data.sourceFileName],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteNode(id);
    },
    [id, deleteNode],
  );

  const handleReplace = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      fileInputRef.current?.click();
    },
    [],
  );

  return (
    <>
      <NodeToolbar nodeId={id} visible={selected}>
        <button
          type="button"
          onClick={handleReplace}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="上传"
        >
          <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={handlePreview}
          disabled={!data.imageUrl}
          className={`p-1.5 rounded ${data.imageUrl ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-40 cursor-not-allowed"}`}
          title="预览"
        >
          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!data.imageUrl}
          className={`p-1.5 rounded ${data.imageUrl ? "hover:bg-gray-100 dark:hover:bg-gray-700" : "opacity-40 cursor-not-allowed"}`}
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
            {data.displayName || "图片"}
          </span>
          {data.sourceFileName && (
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[100px]">
              {data.sourceFileName}
            </span>
          )}
        </div>
      <div className="h-40 p-3 flex items-center justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
        {data.imageUrl ? (
          <div className="h-40 relative cursor-pointer">
            <img
              src={data.previewImageUrl || data.imageUrl}
              alt=""
              className="w-full h-full object-contain rounded"
            />
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
                : "拖拽或粘贴上传"}
          </div>
        )}
      </div>
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
