import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCanvasStore } from "../stores/canvasStore";
import { CANVAS_NODE_TYPES, type TextNodeData } from "../domain/canvasNodes";

interface TextNodeItem {
  edgeId: string;
  nodeId: string;
  content: string;
  displayName: string;
  currentIndex: number;
}

interface TextNodeOrderModalProps {
  targetNodeId: string;
  onClose: () => void;
}

interface SortableItemProps {
  item: TextNodeItem;
  index: number;
}

function SortableItem({ item, index }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.edgeId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    if (!content) return "(空)";
    return content.length > maxLength
      ? content.substring(0, maxLength) + "..."
      : content;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all select-none ${
        isDragging
          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 opacity-50"
          : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500"
      }`}
    >
      <button
        type="button"
        className="text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
          {truncateContent(item.content)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {item.displayName}
        </p>
      </div>
      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center pointer-events-none">
        <span className="text-white text-sm font-bold">
          {index + 1}
        </span>
      </div>
    </div>
  );
}

function DragOverlayItem({ item, index }: SortableItemProps) {
  const truncateContent = (content: string, maxLength: number = 50) => {
    if (!content) return "(空)";
    return content.length > maxLength
      ? content.substring(0, maxLength) + "..."
      : content;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-xl select-none">
      <button
        type="button"
        className="text-gray-400 dark:text-gray-500 cursor-grabbing"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
          {truncateContent(item.content)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {item.displayName}
        </p>
      </div>
      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
        <span className="text-white text-sm font-bold">
          {index + 1}
        </span>
      </div>
    </div>
  );
}

export function TextNodeOrderModal({
  targetNodeId,
  onClose,
}: TextNodeOrderModalProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const updateEdgeIndex = useCanvasStore((s) => s.updateEdgeIndex);

  const [items, setItems] = useState<TextNodeItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const nodeById = new Map(nodes.map((n) => [n.id, n] as const));

    const incomingEdges = edges
      .filter((e) => e.target === targetNodeId)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    const textNodeItems: TextNodeItem[] = [];

    for (const edge of incomingEdges) {
      const sourceNode = nodeById.get(edge.source);
      if (!sourceNode) continue;

      if (sourceNode.type === CANVAS_NODE_TYPES.text) {
        const textData = sourceNode.data as TextNodeData;
        textNodeItems.push({
          edgeId: edge.id,
          nodeId: sourceNode.id,
          content: textData.content || "",
          displayName: textData.displayName || "TextNode",
          currentIndex: edge.index ?? 0,
        });
      }
    }

    setItems(textNodeItems);
  }, [edges, nodes, targetNodeId]);

  const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setItems((items) => {
          const oldIndex = items.findIndex((item) => item.edgeId === active.id);
          const newIndex = items.findIndex((item) => item.edgeId === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
      setActiveId(null);
    },
    []
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleConfirm = useCallback(() => {
    items.forEach((item, newIndex) => {
      updateEdgeIndex(item.edgeId, newIndex);
    });
    onClose();
  }, [items, updateEdgeIndex, onClose]);

  const activeItem = activeId ? items.find((item) => item.edgeId === activeId) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[500px] max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            调整提示词顺序
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                暂无连接的提示词节点
              </div>
            ) : (
              <SortableContext
                items={items.map((item) => item.edgeId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <SortableItem key={item.edgeId} item={item} index={index} />
                  ))}
                </div>
              </SortableContext>
            )}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeItem ? (
              <DragOverlayItem item={activeItem} index={items.indexOf(activeItem)} />
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}