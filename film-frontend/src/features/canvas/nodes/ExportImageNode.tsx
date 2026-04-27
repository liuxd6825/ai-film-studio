import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Eye, Download, Trash2 } from "lucide-react";
import { ExportImageNodeData } from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { downloadUrl } from "../domain/downloadUtils";
import { NodeToolbar } from "../ui/NodeToolbar";

interface ExportImageNodeDataExt extends ExportImageNodeData {}

export const ExportImageNode = memo(function ExportImageNode({
  id,
  data,
  selected,
}: NodeProps & { data: ExportImageNodeDataExt }) {
  const openImageViewer = useCanvasStore((s) => s.openImageViewer);
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  const handlePreview = useCallback(() => {
    if (data.imageUrl) {
      openImageViewer(data.imageUrl);
    }
  }, [data.imageUrl, openImageViewer]);

  const handleDownload = useCallback(() => {
    if (data.imageUrl) {
      downloadUrl(data.imageUrl, data.displayName || "export.jpg");
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
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${
          selected ? "border-2 border-blue-500" : ""
        } shadow-md relative group`}
      >
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {data.displayName || "导出图片"}
          </span>
        </div>
        <div className="p-3">
          {data.imageUrl ? (
            <div className="relative cursor-pointer">
              <img
                src={data.previewImageUrl || data.imageUrl}
                alt=""
                className="w-full h-auto rounded"
                onClick={handlePreview}
              />
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-gray-400 dark:text-gray-500 text-sm">
              等待输入
            </div>
          )}
        </div>
        <Handle type="target" position={Position.Left} className="w-3 h-3" />
        <Handle type="source" position={Position.Right} className="w-3 h-3" />
      </div>
    </>
  );
});