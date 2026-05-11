import { memo } from 'react';
import { Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
import type { Layer } from './types';

export interface ImageEditorLayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onLayerSelect: (id: string) => void;
  onLayerVisibilityChange: (id: string, visible: boolean) => void;
  onLayerLockChange: (id: string, locked: boolean) => void;
  onLayerMove: (id: string, direction: 'up' | 'down') => void;
  onLayerRename: (id: string, name: string) => void;
  onLayerDelete: (id: string) => void;
  onLayerAdd: () => void;
}

export const ImageEditorLayersPanel = memo(function ImageEditorLayersPanel({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerVisibilityChange,
  onLayerLockChange,
  onLayerMove,
  onLayerRename,
  onLayerDelete,
  onLayerAdd,
}: ImageEditorLayersPanelProps) {
  const sortedLayers = [...layers].sort((a, b) => b.order - a.order);

  return (
    <div className="w-[200px] h-full flex flex-col bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onLayerAdd}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
        >
          <Plus size={16} />
          添加图层
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedLayers.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-gray-400 dark:text-gray-500">
            暂无图层
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedLayers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => onLayerSelect(layer.id)}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                  selectedLayerId === layer.id
                    ? 'bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerVisibilityChange(layer.id, !layer.visible);
                  }}
                  className={`p-0.5 rounded transition-colors ${
                    layer.visible
                      ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                  title={layer.visible ? '隐藏' : '显示'}
                >
                  {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerLockChange(layer.id, !layer.locked);
                  }}
                  className={`p-0.5 rounded transition-colors ${
                    layer.locked
                      ? 'text-orange-500 dark:text-orange-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title={layer.locked ? '解锁' : '锁定'}
                >
                  {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>

                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="w-6 h-6 flex-shrink-0 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {layer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={layer.name}
                    onChange={(e) => onLayerRename(layer.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex-1 bg-transparent text-sm truncate outline-none ${
                      selectedLayerId === layer.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-200'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerMove(layer.id, 'up');
                    }}
                    className="p-0.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="上移"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerMove(layer.id, 'down');
                    }}
                    className="p-0.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="下移"
                  >
                    <ChevronDown size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerDelete(layer.id);
                    }}
                    className="p-0.5 text-gray-400 dark:text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-500 dark:hover:text-red-400 rounded"
                    title="删除"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});