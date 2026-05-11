import { memo, useCallback, useMemo } from "react";
import { type NodeProps } from "@xyflow/react";
import { Trash2, ChevronDown, ChevronUp, Users, Mountain, Box } from "lucide-react";
import { type ContainerNodeData, type ContainerType, DEFAULT_NODE_WIDTH } from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { NodeToolbar } from "../ui/NodeToolbar";
import { EditableNodeTitle } from "../components/EditableNodeTitle";

const CONTAINER_TYPE_CONFIG: Record<
  ContainerType,
  { icon: typeof Users; color: string; label: string }
> = {
  character: { icon: Users, color: "#FF6B6B", label: "角色" },
  scene: { icon: Mountain, color: "#4ECDC4", label: "场景" },
  prop: { icon: Box, color: "#FFE66D", label: "道具" },
};

export const ContainerNode = memo(function ContainerNode({
  id,
  data,
  selected,
}: NodeProps & { data: ContainerNodeData }) {
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const nodes = useCanvasStore((s) => s.nodes);

  const containerData = data as ContainerNodeData;
  const config = CONTAINER_TYPE_CONFIG[containerData.containerType];
  const Icon = config.icon;

  const childNodes = useMemo(() => {
    return containerData.childNodeIds
      .map((childId) => nodes.find((n) => n.id === childId))
      .filter((n): n is NonNullable<typeof n> => Boolean(n));
  }, [containerData.childNodeIds, nodes]);

  const handleDelete = useCallback(() => {
    deleteNode(id);
  }, [id, deleteNode]);

  const handleToggleCollapse = useCallback(() => {
    updateNodeData(id, { collapsed: !containerData.collapsed });
  }, [id, containerData.collapsed, updateNodeData]);

  const handleLabelChange = useCallback(
    (newTitle: string) => {
      updateNodeData(id, { label: newTitle });
    },
    [id, updateNodeData]
  );

  return (
    <>
      <NodeToolbar nodeId={id} visible={selected}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleCollapse();
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          title={containerData.collapsed ? "展开" : "折叠"}
        >
          {containerData.collapsed ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          )}
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
        className={`bg-white dark:bg-gray-800 rounded-lg border-2 border-solid transition-all duration-200 flex flex-col ${
          selected ? "border-blue-500" : ""
        } ${containerData.collapsed ? "w-[120px] h-[60px]" : "w-[300px] h-[400px]"}`}
        style={{ borderColor: config.color }}
      >
        <div
          className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 rounded-t-lg shrink-0"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
          <EditableNodeTitle
            nodeType={config.label}
            title={containerData.label || ""}
            onSave={handleLabelChange}
            maxLength={50}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleCollapse();
            }}
            className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {containerData.collapsed ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        {!containerData.collapsed && (
          <div className="flex-1 p-3 overflow-x-auto">
            {childNodes.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-sm text-gray-400 dark:text-gray-500 text-center">
                  拖拽节点到此处收纳
                </div>
              </div>
            ) : (
              <div className="flex gap-2 h-full items-center">
                {childNodes.map((child, index) => (
                  <div
                    key={child.id}
                    className="shrink-0 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                    style={{
                      width: DEFAULT_NODE_WIDTH,
                    }}
                  >
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                      {index + 1}. {(child.data as { displayName?: string }).displayName || child.type}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
});
