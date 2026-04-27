import { memo, useCallback } from "react";
import { type NodeProps } from "@xyflow/react";
import { Trash2, Unlink2 } from "lucide-react";
import { GroupNodeData } from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { NodeToolbar } from "../ui/NodeToolbar";

interface GroupNodeDataExt extends GroupNodeData {}

export const GroupNode = memo(function GroupNode({
  id,
  data,
  selected,
}: NodeProps & { data: GroupNodeDataExt }) {
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const ungroupNode = useCanvasStore((s) => s.ungroupNode);

  const handleDelete = useCallback(() => {
    deleteNode(id);
  }, [id, deleteNode]);

  const handleUngroup = useCallback(() => {
    ungroupNode(id);
  }, [id, ungroupNode]);

  return (
    <>
      <NodeToolbar nodeId={id} visible={selected}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleUngroup();
          }}
          className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded"
          title="解除分组"
        >
          <Unlink2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
        className={`min-w-[200px] min-h-[100px] bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 ${
          selected ? "border-blue-500" : "border-blue-300 dark:border-blue-700"
        } border-dashed`}
        style={{ opacity: 0.9 }}
      >
        <div className="p-2 border-b border-blue-200 dark:border-blue-800 bg-blue-100 dark:bg-blue-900/30 rounded-t-lg">
          <span className="font-medium text-xs text-blue-700 dark:text-blue-400">
            {data.label || "分组"}
          </span>
        </div>
        <div className="p-3">
          <div className="text-xs text-blue-400 dark:text-blue-500">拖拽节点到此处分组</div>
        </div>
      </div>
    </>
  );
});