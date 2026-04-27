import { useCallback, useState, useRef, useEffect } from "react";
import { X, Minus, Grip, Trash2 } from "lucide-react";
import { useCanvasStore } from "../stores/canvasStore";
import { type Keyframe } from "../domain/canvasNodes";

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

interface KeyframePanelProps {
  onDragStart?: (keyframe: Keyframe, event: React.DragEvent) => void;
}

export function KeyframePanel({ onDragStart }: KeyframePanelProps) {
  const keyframePanelOpen = useCanvasStore((s) => s.keyframePanelOpen);
  const keyframePanelPosition = useCanvasStore((s) => s.keyframePanelPosition);
  const setKeyframePanelOpen = useCanvasStore((s) => s.setKeyframePanelOpen);
  const setKeyframePanelPosition = useCanvasStore((s) => s.setKeyframePanelPosition);
  const getAllKeyframes = useCanvasStore((s) => s.getAllKeyframes);
  const removeKeyframe = useCanvasStore((s) => s.removeKeyframe);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const keyframes = getAllKeyframes();

  useEffect(() => {
    if (keyframes.length > 0 && !keyframePanelOpen) {
      setKeyframePanelOpen(true);
    }
  }, [keyframes.length, keyframePanelOpen, setKeyframePanelOpen]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest(".panel-content")) {
        return;
      }
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - keyframePanelPosition.x,
        y: e.clientY - keyframePanelPosition.y,
      });
    },
    [keyframePanelPosition],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setKeyframePanelPosition(
        e.clientX - dragOffset.x,
        e.clientY - dragOffset.y,
      );
    },
    [isDragging, dragOffset, setKeyframePanelPosition],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleClose = useCallback(() => {
    setKeyframePanelOpen(false);
  }, [setKeyframePanelOpen]);

  const handleToggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const handleKeyframeDragStart = useCallback(
    (keyframe: Keyframe, e: React.DragEvent) => {
      e.dataTransfer.setData("application/keyframe", JSON.stringify(keyframe));
      e.dataTransfer.effectAllowed = "copy";
      if (onDragStart) {
        onDragStart(keyframe, e);
      }
    },
    [onDragStart],
  );

  const handleDeleteKeyframe = useCallback(
    (keyframeId: string) => {
      removeKeyframe(keyframeId);
    },
    [removeKeyframe],
  );

  if (!keyframePanelOpen) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className="fixed bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl z-50 pointer-events-auto"
      style={{
        left: keyframePanelPosition.x,
        top: keyframePanelPosition.y,
        width: 320,
        maxHeight: isMinimized ? 40 : 400,
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Grip className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">关键帧面板</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">({keyframes.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToggleMinimize}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="panel-content p-2 overflow-y-auto" style={{ maxHeight: 360 }}>
          {keyframes.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-sm text-gray-400 dark:text-gray-500">
              暂无关键帧
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {keyframes.map((keyframe) => (
                <div
                  key={keyframe.id}
                  className="relative group"
                  draggable
                  onDragStart={(e) => handleKeyframeDragStart(keyframe, e)}
                >
                  <img
                    src={keyframe.imageUrl}
                    alt={`Frame at ${formatTimestamp(keyframe.timestamp)}`}
                    className="w-full aspect-video object-cover rounded border border-gray-200 dark:border-gray-600 cursor-grab hover:ring-2 hover:ring-blue-400 transition-all"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-xs px-1 py-0.5 rounded-b">
                    {formatTimestamp(keyframe.timestamp)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteKeyframe(keyframe.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除关键帧"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}