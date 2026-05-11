import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Canvas, PencilBrush, IText, Line, Rect, Circle, FabricImage, FabricObject, Point } from 'fabric';
import { generateLayerId, generateLayerName, rgbaToHex } from './utils';
import type { DrawingTool, EditorColor, Layer } from './types';

export interface ImageEditorCanvasProps {
  imageUrl: string;
  activeTool: DrawingTool;
  brushSize: number;
  color: EditorColor;
  layers: Layer[];
  onLayersChange: (layers: Layer[]) => void;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  onCanvasReady?: (canvas: Canvas) => void;
}

interface ShapeDrawState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  tempShape: Line | Rect | Circle | null;
}

const CANVAS_DEFAULTS = {
  backgroundColor: '#ffffff',
  selectionColor: '#f3f3f3',
  selectionBorderColor: '#cccccc',
  selectionLineWidth: 1,
} as const;

function ImageEditorCanvasComponent({
  imageUrl,
  activeTool,
  brushSize,
  color,
  layers,
  onLayersChange,
  onHistoryChange,
  onCanvasReady,
}: ImageEditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const imageRef = useRef<FabricImage | null>(null);
  const [layerCount, setLayerCount] = useState(0);
  const historyStackRef = useRef<Layer[][]>([]);
  const historyIndexRef = useRef(-1);
  const shapeStateRef = useRef<ShapeDrawState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    tempShape: null,
  });

  const saveToHistory = useCallback(() => {
    const currentLayers = [...layers];
    historyStackRef.current = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    historyStackRef.current.push(currentLayers);
    historyIndexRef.current++;
    onHistoryChange(historyIndexRef.current > 0, historyIndexRef.current < historyStackRef.current.length - 1);
  }, [layers, onHistoryChange]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      ...CANVAS_DEFAULTS,
      width: 800,
      height: 600,
    });

    fabricRef.current = canvas;

    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    const handleObjectAdded = () => {
      if (fabricRef.current) {
        const objects = fabricRef.current.getObjects();
        const currentLayers = objects
          .filter((obj) => obj !== imageRef.current)
          .map((obj, index) => ({
            id: (obj as FabricObject & { layerId?: string }).layerId || generateLayerId(),
            name: (obj as FabricObject & { layerName?: string }).layerName || generateLayerName(index + 1),
            fabricObject: obj,
            visible: obj.visible !== false,
            locked: obj.selectable === false && obj.evented === false,
            order: index,
          }));
        onLayersChange(currentLayers);
      }
    };

    canvas.on('object:added', handleObjectAdded);

    return () => {
      canvas.off('object:added', handleObjectAdded);
      canvas.dispose();
      fabricRef.current = null;
      imageRef.current = null;
    };
  }, [onLayersChange]);

  useEffect(() => {
    if (!fabricRef.current || !imageUrl) return;

    FabricImage.fromURL(imageUrl).then((img) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const scale = Math.min(
        (canvas.width || 800) / (img.width || 1),
        (canvas.height || 600) / (img.height || 1)
      );

      img.scale(scale);
      img.set({
        left: (canvas.width || 800) / 2,
        top: (canvas.height || 600) / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });

      (img as FabricObject & { layerId?: string }).layerId = 'background_image_layer';
      (img as FabricObject & { layerName?: string }).layerName = '背景图片';

      canvas.add(img);
      canvas.sendObjectToBack(img);
      imageRef.current = img;
      canvas.renderAll();

      historyStackRef.current = [];
      historyIndexRef.current = -1;
      saveToHistory();
    });
  }, [imageUrl, saveToHistory]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;

    if (activeTool === 'brush') {
      const brush = new PencilBrush(canvas);
      brush.width = brushSize;
      brush.color = rgbaToHex(`rgba(${parseInt(color.hex.slice(1, 3), 16)}, ${parseInt(color.hex.slice(3, 5), 16)}, ${parseInt(color.hex.slice(5, 7), 16)}, ${color.opacity})`);
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
    } else if (activeTool === 'eraser') {
      const brush = new PencilBrush(canvas);
      brush.width = brushSize * 2;
      brush.color = '#ffffff';
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
    }
  }, [activeTool, brushSize, color]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: any) => {
      if (activeTool === 'text') return;
      if (activeTool !== 'line' && activeTool !== 'rectangle' && activeTool !== 'circle') return;

      const pointer = canvas.getScenePoint(opt.e);
      shapeStateRef.current = {
        isDrawing: true,
        startX: pointer.x,
        startY: pointer.y,
        tempShape: null,
      };
    };

    const handleMouseMove = (opt: any) => {
      if (!shapeStateRef.current.isDrawing) return;

      const pointer = canvas.getScenePoint(opt.e);
      const { startX, startY, tempShape } = shapeStateRef.current;

      if (tempShape) {
        canvas.remove(tempShape);
      }

      let newShape: Line | Rect | Circle | null = null;
      const hexColor = color.hex;

      if (activeTool === 'line') {
        newShape = new Line([startX, startY, pointer.x, pointer.y], {
          stroke: hexColor,
          strokeWidth: brushSize,
          strokeLineCap: 'round',
        });
      } else if (activeTool === 'rectangle') {
        const width = pointer.x - startX;
        const height = pointer.y - startY;
        newShape = new Rect({
          left: startX,
          top: startY,
          width: Math.abs(width),
          height: Math.abs(height),
          stroke: hexColor,
          strokeWidth: brushSize,
          fill: 'transparent',
          originX: width < 0 ? 'right' : 'left',
          originY: height < 0 ? 'bottom' : 'top',
        });
      } else if (activeTool === 'circle') {
        const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2));
        newShape = new Circle({
          left: startX,
          top: startY,
          radius,
          stroke: hexColor,
          strokeWidth: brushSize,
          fill: 'transparent',
          originX: 'center',
          originY: 'center',
        });
      }

      if (newShape) {
        (newShape as FabricObject & { layerId?: string }).layerId = generateLayerId();
        (newShape as FabricObject & { layerName?: string }).layerName = generateLayerName(layerCount + 1);
        canvas.add(newShape);
        shapeStateRef.current.tempShape = newShape;
        canvas.renderAll();
      }
    };

    const handleMouseUp = () => {
      if (shapeStateRef.current.isDrawing && shapeStateRef.current.tempShape) {
        setLayerCount((c) => c + 1);
        saveToHistory();
      }
      shapeStateRef.current.isDrawing = false;
      shapeStateRef.current.tempShape = null;
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [activeTool, brushSize, color, layerCount, saveToHistory]);

  useEffect(() => {
    if (activeTool !== 'text' || !fabricRef.current) return;

    const canvas = fabricRef.current;

    const handleTextCreation = (opt: any) => {
      const pointer = canvas.getScenePoint(opt.e);
      const text = new IText('', {
        left: pointer.x,
        top: pointer.y,
        fontSize: brushSize * 2,
        fill: color.hex,
        fontFamily: 'sans-serif',
      });

      (text as FabricObject & { layerId?: string }).layerId = generateLayerId();
      (text as FabricObject & { layerName?: string }).layerName = generateLayerName(layerCount + 1);

      canvas.add(text);
      text.enterEditing();
      setLayerCount((c) => c + 1);
      saveToHistory();

      canvas.off('mouse:down', handleTextCreation);
    };

    canvas.on('mouse:down', handleTextCreation);

    return () => {
      canvas.off('mouse:down', handleTextCreation);
    };
  }, [activeTool, brushSize, color, layerCount, saveToHistory]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    let lastPosX = canvas.viewportTransform?.[4] || 0;
    let lastPosY = canvas.viewportTransform?.[5] || 0;
    let isDragging = false;

    const handleWheel = (opt: any) => {
      const e = opt.e as WheelEvent;
      e.preventDefault();
      const delta = e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.min(Math.max(0.1, zoom), 5);
      const point = new Point(e.offsetX, e.offsetY);
      canvas.zoomToPoint(point, zoom);
    };

    const handleMouseDown = (opt: any) => {
      const e = opt.e as MouseEvent;
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isDragging = true;
        lastPosX = e.clientX;
        lastPosY = e.clientY;
        canvas.selection = false;
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!isDragging) return;
      const e = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform;
      if (vpt) {
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      canvas.selection = true;
    };

    canvas.on('mouse:wheel', handleWheel);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:wheel', handleWheel);
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, []);

  return (
    <canvas ref={canvasRef} />
  );
}

export const ImageEditorCanvas = memo(ImageEditorCanvasComponent);
