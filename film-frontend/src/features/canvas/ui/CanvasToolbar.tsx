import { Save, ZoomIn, ZoomOut, Maximize2, Lock, Unlock } from "lucide-react";
import { useCanvasStore } from "../stores/canvasStore";

export function CanvasToolbar() {
  const isLocked = useCanvasStore((s) => s.isLocked);
  const setLocked = useCanvasStore((s) => s.setLocked);
  const currentZoom = useCanvasStore((s) => s.currentZoom);
  const toolbarActions = useCanvasStore((s) => s.toolbarActions);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toolbarActions.manualSave}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
        title="保存画布 (Ctrl+S)"
      >
        <Save size={16} />
      </button>
      <button
        onClick={() => setLocked(!isLocked)}
        className={`p-1.5 rounded transition-colors ${
          isLocked
            ? "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600"
            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        }`}
        title={isLocked ? "解锁画布" : "锁定画布"}
      >
        {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
      </button>
      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />
      <button
        onClick={toolbarActions.zoomReset}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
        title="适应视图"
      >
        <Maximize2 size={16} />
      </button>
      <button
        onClick={toolbarActions.zoomOut}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
        title="缩小"
      >
        <ZoomOut size={16} />
      </button>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1 min-w-[3rem] text-center">
        {Math.round(currentZoom * 100)}%
      </span>
      <button
        onClick={toolbarActions.zoomIn}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-400"
        title="放大"
      >
        <ZoomIn size={16} />
      </button>
    </div>
  );
}