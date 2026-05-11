import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Download, Save, X, FileImage } from 'lucide-react';
import { ImageEditorToolbar } from './ImageEditorToolbar';
import { ImageEditorCanvas } from './ImageEditorCanvas';
import { ImageEditorLayersPanel } from './ImageEditorLayersPanel';
import type { DrawingTool, EditorColor, Layer, ImageEditorModalProps } from './types';
import { Canvas as FabricCanvas } from 'fabric';

interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

function ImageEditorModalComponent({
  open,
  imageUrl,
  nodeId: _nodeId,
  onClose,
  onSave,
}: ImageEditorModalProps) {
  const [activeTool, setActiveTool] = useState<DrawingTool>('brush');
  const [brushSize, setBrushSize] = useState(10);
  const [color, setColor] = useState<EditorColor>({ hex: '#000000', opacity: 1 });
  const [layers, setLayers] = useState<Layer[]>([]);
  const [history, setHistory] = useState<HistoryState>({ canUndo: false, canRedo: false });
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);

  const handleLayersChange = useCallback((newLayers: Layer[]) => {
    setLayers(newLayers);
  }, []);

  const handleHistoryChange = useCallback((canUndo: boolean, canRedo: boolean) => {
    setHistory({ canUndo, canRedo });
  }, []);

  const handleUndo = useCallback(() => {
    // Undo is handled internally by ImageEditorCanvas
  }, []);

  const handleRedo = useCallback(() => {
    // Redo is handled internally by ImageEditorCanvas
  }, []);

  const handleCanvasReady = useCallback((canvas: FabricCanvas) => {
    fabricRef.current = canvas;
  }, []);

  const handleLayerSelect = useCallback((id: string) => {
    setSelectedLayerId(id);
  }, []);

  const handleLayerVisibilityChange = useCallback((id: string, visible: boolean) => {
    if (!fabricRef.current) return;
    const object = layers.find(l => l.id === id)?.fabricObject;
    if (object) {
      object.set('visible', visible);
      fabricRef.current.renderAll();
    }
  }, [layers]);

  const handleLayerLockChange = useCallback((id: string, locked: boolean) => {
    if (!fabricRef.current) return;
    const object = layers.find(l => l.id === id)?.fabricObject;
    if (object) {
      object.set({
        selectable: !locked,
        evented: !locked,
      });
      fabricRef.current.renderAll();
    }
  }, [layers]);

  const handleLayerMove = useCallback((id: string, direction: 'up' | 'down') => {
    if (!fabricRef.current) return;
    const layer = layers.find(l => l.id === id);
    if (!layer) return;

    if (direction === 'up') {
      fabricRef.current.bringObjectForward(layer.fabricObject);
    } else {
      fabricRef.current.sendObjectBackwards(layer.fabricObject);
    }
    fabricRef.current.renderAll();
  }, [layers]);

  const handleLayerRename = useCallback((id: string, name: string) => {
    setLayers(prev => prev.map(l =>
      l.id === id ? { ...l, name } : l
    ));
  }, []);

  const handleLayerDelete = useCallback((id: string) => {
    if (!fabricRef.current) return;
    const layer = layers.find(l => l.id === id);
    if (layer && layer.id !== 'background_image_layer') {
      fabricRef.current.remove(layer.fabricObject);
      fabricRef.current.renderAll();
    }
  }, [layers]);

  const handleLayerAdd = useCallback(() => {
    // Adding empty layer - user can add text or shapes using tools
  }, []);

  const exportCanvas = useCallback((): string | null => {
    if (!fabricRef.current) return null;
    return fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });
  }, []);

  const handleApplyToNode = useCallback(() => {
    const dataUrl = exportCanvas();
    if (dataUrl) {
      onSave({ imageUrl: dataUrl, saveAsNewNode: false });
    }
  }, [exportCanvas, onSave]);

  const handleSaveAsNewNode = useCallback(() => {
    const dataUrl = exportCanvas();
    if (dataUrl) {
      onSave({ imageUrl: dataUrl, saveAsNewNode: true });
    }
  }, [exportCanvas, onSave]);

  const handleDownload = useCallback(() => {
    const dataUrl = exportCanvas();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `edited-image-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [exportCanvas]);

  useEffect(() => {
    if (!open) {
      setActiveTool('brush');
      setBrushSize(10);
      setColor({ hex: '#000000', opacity: 1 });
      setLayers([]);
      setSelectedLayerId(null);
      fabricRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
      onClick={onClose}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-[800px] flex flex-col shadow-xl max-h-[600px] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">图片编辑器</h3>
          <button
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <ImageEditorToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          color={color}
          onColorChange={setColor}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-auto p-4">
            <ImageEditorCanvas
              imageUrl={imageUrl}
              activeTool={activeTool}
              brushSize={brushSize}
              color={color}
              layers={layers}
              onLayersChange={handleLayersChange}
              onHistoryChange={handleHistoryChange}
              onCanvasReady={handleCanvasReady}
            />
          </div>

          <ImageEditorLayersPanel
            layers={layers}
            selectedLayerId={selectedLayerId}
            onLayerSelect={handleLayerSelect}
            onLayerVisibilityChange={handleLayerVisibilityChange}
            onLayerLockChange={handleLayerLockChange}
            onLayerMove={handleLayerMove}
            onLayerRename={handleLayerRename}
            onLayerDelete={handleLayerDelete}
            onLayerAdd={handleLayerAdd}
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            onClick={onClose}
          >
            <X size={16} />
            关闭
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            onClick={handleDownload}
          >
            <Download size={16} />
            下载
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            onClick={handleSaveAsNewNode}
          >
            <FileImage size={16} />
            另存为新节点
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 rounded transition-colors"
            onClick={handleApplyToNode}
          >
            <Save size={16} />
            应用到节点
          </button>
        </div>
      </div>
    </div>
  );
}

export const ImageEditorModal = memo(ImageEditorModalComponent);
