import { memo } from 'react';
import { Pencil, Eraser, Minus, Square, Circle, Type, Undo2, Redo2 } from 'lucide-react';
import type { DrawingTool, EditorColor } from './types';

export interface ImageEditorToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  color: EditorColor;
  onColorChange: (color: EditorColor) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
  '#ff00ff', '#00ffff', '#ff6600', '#6600ff', '#00ff66', '#666666',
];

const TOOLS: { id: DrawingTool; icon: typeof Pencil; label: string }[] = [
  { id: 'brush', icon: Pencil, label: '画笔' },
  { id: 'eraser', icon: Eraser, label: '橡皮擦' },
  { id: 'line', icon: Minus, label: '直线' },
  { id: 'rectangle', icon: Square, label: '矩形' },
  { id: 'circle', icon: Circle, label: '圆形' },
  { id: 'text', icon: Type, label: '文字' },
];

export const ImageEditorToolbar = memo(function ImageEditorToolbar({
  activeTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  color,
  onColorChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: ImageEditorToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-3 h-12 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`p-1.5 rounded transition-colors ${
                activeTool === tool.id
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title={tool.label}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange({ ...color, hex: c })}
              className={`w-5 h-5 rounded border border-gray-300 dark:border-gray-600 ${
                color.hex === c ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800' : ''
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">透明</span>
          <input
            type="range"
            min={0}
            max={100}
            value={color.opacity * 100}
            onChange={(e) => onColorChange({ ...color, opacity: Number(e.target.value) / 100 })}
            className="w-16 h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
            {Math.round(color.opacity * 100)}%
          </span>
        </div>
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">大小</span>
        <input
          type="range"
          min={1}
          max={100}
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="w-24 h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
          {brushSize}px
        </span>
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded transition-colors ${
            canUndo
              ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="撤销"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded transition-colors ${
            canRedo
              ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="重做"
        >
          <Redo2 size={18} />
        </button>
      </div>
    </div>
  );
});
