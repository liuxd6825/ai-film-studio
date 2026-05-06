export const CANVAS_NODE_TYPES = {
  upload: "uploadNode",
  imageEdit: "imageNode",
  exportImage: "exportImageNode",
  textAnnotation: "textAnnotationNode",
  group: "groupNode",
  storyboardSplit: "storyboardNode",
  storyboardGen: "storyboardGenNode",
  videoGen: "videoGenNode",
  videoUpload: "videoUploadNode",
  text: "textNode",
} as const;

export type CanvasNodeType =
  (typeof CANVAS_NODE_TYPES)[keyof typeof CANVAS_NODE_TYPES];

export const DEFAULT_ASPECT_RATIO = "1:1";
export const AUTO_REQUEST_ASPECT_RATIO = "auto";
export const DEFAULT_NODE_WIDTH = 220;
export const EXPORT_RESULT_NODE_DEFAULT_WIDTH = 384;
export const EXPORT_RESULT_NODE_LAYOUT_HEIGHT = 288;
export const EXPORT_RESULT_NODE_MIN_WIDTH = 168;
export const EXPORT_RESULT_NODE_MIN_HEIGHT = 168;

export const IMAGE_SIZES = ["1K", "2K", "4K", "8K"] as const;
export const IMAGE_ASPECT_RATIOS = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "21:9",
] as const;

export type ImageSize = (typeof IMAGE_SIZES)[number];

export interface NodeDisplayData {
  displayName?: string;
  [key: string]: unknown;
}

export interface NodeImageData extends NodeDisplayData {
  imageUrl: string | null;
  previewImageUrl?: string | null;
  aspectRatio: string;
  isSizeManuallyAdjusted?: boolean;
  [key: string]: unknown;
}

export interface Keyframe {
  id: string;
  videoNodeId: string;
  videoUrl: string;
  timestamp: number;
  imageUrl: string;
  width?: number;
  height?: number;
  createdAt: number;
}

export interface VideoUploadNodeData extends NodeDisplayData {
  videoUrl: string | null;
  previewVideoUrl: string | null;
  sourceFileName: string;
  duration?: number;
  width?: number;
  height?: number;
  frameRate?: number;
  fileSize?: number;
  keyframes?: Keyframe[];
}

export interface UploadImageNodeData extends NodeImageData {
  sourceFileName?: string | null;
}

export type ExportImageNodeResultKind =
  | "generic"
  | "storyboardGenOutput"
  | "storyboardSplitExport"
  | "storyboardFrameEdit";

export interface ExportImageNodeData extends NodeImageData {
  resultKind?: ExportImageNodeResultKind;
}

export interface GroupNodeData extends NodeDisplayData {
  label: string;
  [key: string]: unknown;
}

export interface TextAnnotationNodeData extends NodeDisplayData {
  content: string;
  [key: string]: unknown;
}

export type ImageEditWorkMode = "text-to-image" | "text-to-video";

export type ImageEditAIModel = string;

export type ImageEditTaskStatus =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "unknown";

export interface ImageEditNodeData extends NodeImageData {
  prompt: string;
  workMode: ImageEditWorkMode;
  aiModel: ImageEditAIModel;
  size: ImageSize;
  requestAspectRatio?: string;
  extraParams?: Record<string, unknown>;
  isGenerating?: boolean;
  generationStartedAt?: number | null;
  generationDurationMs?: number;
  referenceImages?: string[];
  taskId?: string;
  taskStatus?: ImageEditTaskStatus;
  taskProgress?: number;
  errorMessage?: string;
  mode?: 'undecided' | 'upload' | 'prompt';
  sourceType?: 'upload' | 'generated' | 'reference';
  sourceFileName?: string | null;
  promptType?: string;
}

export interface StoryboardFrameItem {
  id: string;
  imageUrl: string | null;
  previewImageUrl?: string | null;
  aspectRatio?: string;
  note: string;
  order: number;
}

export interface StoryboardExportOptions {
  showFrameIndex: boolean;
  showFrameNote: boolean;
  notePlacement: "overlay" | "bottom";
  imageFit: "cover" | "contain";
  frameIndexPrefix: string;
  cellGap: number;
  outerPadding: number;
  fontSize: number;
  backgroundColor: string;
  textColor: string;
}

export interface StoryboardSplitNodeData {
  displayName?: string;
  aspectRatio: string;
  frameAspectRatio?: string;
  gridRows: number;
  gridCols: number;
  frames: StoryboardFrameItem[];
  exportOptions?: StoryboardExportOptions;
  [key: string]: unknown;
}

export interface StoryboardGenFrameItem {
  id: string;
  description: string;
  referenceIndex: number | null;
}

export type StoryboardRatioControlMode = "overall" | "cell";

export interface StoryboardGenNodeData {
  displayName?: string;
  gridRows: number;
  gridCols: number;
  frames: StoryboardGenFrameItem[];
  ratioControlMode?: StoryboardRatioControlMode;
  model: string;
  size: ImageSize;
  requestAspectRatio: string;
  extraParams?: Record<string, unknown>;
  imageUrl: string | null;
  previewImageUrl?: string | null;
  aspectRatio: string;
  isGenerating?: boolean;
  generationStartedAt?: number | null;
  generationDurationMs?: number;
  [key: string]: unknown;
}

export type VideoResolution = "720p" | "1080p" | "4K";
export type VideoFPS = 24 | 30 | 60;

export type VideoGenTaskStatus =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "unknown";

export interface VideoGenNodeData extends NodeDisplayData {
  prompt: string;
  aspectRatio: string;
  resolution: VideoResolution;
  fps: VideoFPS;
  duration: number;
  aiModel: string;
  referenceImages?: string[];
  taskId?: string;
  taskStatus?: VideoGenTaskStatus;
  taskProgress?: number;
  errorMessage?: string;
  videoUrl?: string | null;
  previewVideoUrl?: string | null;
  keyframes?: Keyframe[];
  mode?: 'undecided' | 'upload' | 'prompt';
  sourceType?: 'upload' | 'generated' | 'reference';
  sourceFileName?: string | null;
}

export interface TextNodeData extends NodeDisplayData {
  content: string;
  prompt: string;
  aiModel?: string;
  promptType?: string;
  width?: number;
  height?: number;
}

export type CanvasNodeData =
  | UploadImageNodeData
  | ExportImageNodeData
  | TextAnnotationNodeData
  | GroupNodeData
  | ImageEditNodeData
  | StoryboardSplitNodeData
  | StoryboardGenNodeData
  | VideoGenNodeData
  | VideoUploadNodeData
  | TextNodeData;

export interface CanvasNode {
  id: string;
  type: CanvasNodeType;
  position: { x: number; y: number };
  data: CanvasNodeData;
  width?: number;
  height?: number;
  measured?: { width?: number; height?: number };
  selected?: boolean;
  parentId?: string;
  extent?: "parent" | undefined;
  style?: Record<string, unknown>;
  createdAt?: number;
}

export const DEFAULT_EDGE_STROKE_WIDTH = 2;
export const DEFAULT_EDGE_OPACITY = 0.8;

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  style?: {
    strokeWidth?: number;
    opacity?: number;
  };
}

export interface NodeCreationDto {
  type: CanvasNodeType;
  position: { x: number; y: number };
  data?: Partial<CanvasNodeData>;
}

export interface StoryboardNodeCreationDto {
  position: { x: number; y: number };
  rows: number;
  cols: number;
  frames: StoryboardFrameItem[];
}

export const NODE_TOOL_TYPES = {
  crop: "crop",
  annotate: "annotate",
  splitStoryboard: "split-storyboard",
} as const;

export type NodeToolType =
  (typeof NODE_TOOL_TYPES)[keyof typeof NODE_TOOL_TYPES];

export interface ActiveToolDialog {
  nodeId: string;
  toolType: NodeToolType;
}

export function isUploadNode(
  node: CanvasNode | null | undefined,
): node is CanvasNode & { data: UploadImageNodeData } {
  return node?.type === CANVAS_NODE_TYPES.upload;
}

export function isImageEditNode(
  node: CanvasNode | null | undefined,
): node is CanvasNode & { data: ImageEditNodeData } {
  return node?.type === CANVAS_NODE_TYPES.imageEdit;
}

export function isExportImageNode(
  node: CanvasNode | null | undefined,
): node is CanvasNode & { data: ExportImageNodeData } {
  return node?.type === CANVAS_NODE_TYPES.exportImage;
}

export function isGroupNode(
  node: CanvasNode | null | undefined,
): node is CanvasNode & { data: GroupNodeData } {
  return node?.type === CANVAS_NODE_TYPES.group;
}

export function isTextAnnotationNode(
  node: CanvasNode | null | undefined,
): node is CanvasNode & { data: TextAnnotationNodeData } {
  return node?.type === CANVAS_NODE_TYPES.textAnnotation;
}

export function isStoryboardSplitNode(
  node: CanvasNode | null | undefined,
): node is CanvasNode & { data: StoryboardSplitNodeData } {
  return node?.type === CANVAS_NODE_TYPES.storyboardSplit;
}

export function isStoryboardGenNode(
  node: CanvasNode | null | undefined,
): node is CanvasNode & { data: StoryboardGenNodeData } {
  return node?.type === CANVAS_NODE_TYPES.storyboardGen;
}

export function isVideoGenNode(
  node: CanvasNode | null | undefined,
): node is CanvasNode & { data: VideoGenNodeData } {
  return node?.type === CANVAS_NODE_TYPES.videoGen;
}

export function isVideoUploadNode(
  node: CanvasNode | null | undefined,
): node is CanvasNode & { data: VideoUploadNodeData } {
  return node?.type === CANVAS_NODE_TYPES.videoUpload;
}

export function nodeHasVideo(node: CanvasNode | null | undefined): boolean {
  return isVideoUploadNode(node) && !!(node.data as VideoUploadNodeData).videoUrl;
}

export function nodeHasImage(node: CanvasNode | null | undefined): boolean {
  if (!node) {
    return false;
  }

  if (isUploadNode(node) || isImageEditNode(node) || isExportImageNode(node)) {
    return Boolean(node.data.imageUrl);
  }

  if (isStoryboardSplitNode(node)) {
    return node.data.frames.some((frame) => Boolean(frame.imageUrl));
  }

  if (isStoryboardGenNode(node)) {
    return Boolean(node.data.imageUrl);
  }

  if (isVideoGenNode(node)) {
    return Boolean(node.data.videoUrl);
  }

  return false;
}
