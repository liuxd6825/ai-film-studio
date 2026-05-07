import { memo, useCallback } from "react";
import { type NodeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { TextAnnotationNodeData } from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { NodeToolbar } from "../ui/NodeToolbar";
import { EditableNodeTitle } from "../components/EditableNodeTitle";

interface TextAnnotationNodeDataExt extends TextAnnotationNodeData {}

export const TextAnnotationNode = memo(function TextAnnotationNode({
  id,
  data,
  selected,
}: NodeProps & { data: TextAnnotationNodeDataExt }) {
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

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
        className={`min-w-[150px] bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 ${
          selected ? "border-blue-500" : "border-yellow-300 dark:border-yellow-700"
        } shadow-md`}
      >
        <div className="p-3 border-b border-yellow-200 dark:border-yellow-800">
          <EditableNodeTitle
            nodeType="文本标注"
            title={data.displayName || ""}
            onSave={(newTitle) => updateNodeData(id, { displayName: newTitle })}
            maxLength={50}
          />
        </div>
        <div className="p-3">
          <div className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {data.content || "双击编辑文本"}
          </div>
        </div>
      </div>
    </>
  );
});