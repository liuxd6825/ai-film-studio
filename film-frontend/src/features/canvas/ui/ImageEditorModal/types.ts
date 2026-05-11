import { Object as FabricObject } from 'fabric';

export type DrawingTool = 'brush' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'text';

export interface EditorColor {
  hex: string;
  opacity: number;
}

export interface Layer {
  id: string;
  name: string;
  fabricObject: FabricObject;
  visible: boolean;
  locked: boolean;
  order: number;
}

export interface HistoryState {
  layers: Layer[];
  timestamp: number;
}

export interface ImageEditorModalProps {
  open: boolean;
  imageUrl: string;
  nodeId: string;
  onClose: () => void;
  onSave: (result: {
    imageUrl: string;
    saveAsNewNode?: boolean;
    download?: boolean;
  }) => void;
}
