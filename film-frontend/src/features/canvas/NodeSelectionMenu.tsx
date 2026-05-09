import { useCallback } from "react";
import { useCanvasStore } from "./stores/canvasStore";
import { getMenuNodeDefinitions } from "./domain/nodeRegistry";
import { type CanvasNodeType } from "./domain/canvasNodes";

interface NodeSelectionMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
}

export function NodeSelectionMenu({
  position,
  onClose,
}: NodeSelectionMenuProps) {
  const { addNode, lastAddNodePosition } = useCanvasStore();

  const handleAddNode = useCallback(
    (type: CanvasNodeType) => {
      const nodePosition = lastAddNodePosition || { x: position.x, y: position.y };
      addNode(type, nodePosition);
      onClose();
    },
    [addNode, position, lastAddNodePosition, onClose],
  );

  const menuDefinitions = getMenuNodeDefinitions();

  const getIcon = (icon: string) => {
    switch (icon) {
      case "upload":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        );
      case "sparkles":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        );
      case "layout":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        );
      case "text":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getLabel = (def: { menuLabelKey: string }) => {
    const labels: Record<string, string> = {
     // "node.menu.uploadImage": "导入图片",
     // "node.menu.videoUpload": "导入视频",
      "node.menu.text": "文本",
      "node.menu.aiImageGeneration": "图片",
      "node.menu.videoGen": "视频",
      "node.menu.storyboard": "故事板",
      "node.menu.textAnnotation": "备注",
      "node.menu.storyboardGen": "故事板",
      "node.menu.audio": "音频",
    };
    return labels[def.menuLabelKey] || def.menuLabelKey;
  };

  return (
    <div
      className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
        添加节点
      </div>
      {menuDefinitions.map((def) => (
        <button
          key={def.type}
          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
          onClick={() => handleAddNode(def.type)}
        >
          <span className="text-gray-600 dark:text-gray-400">{getIcon(def.menuIcon)}</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">{getLabel(def)}</span>
        </button>
      ))}
      <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
        <button
          className="w-full px-3 py-2 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={onClose}
        >
          取消
        </button>
      </div>
    </div>
  );
}
