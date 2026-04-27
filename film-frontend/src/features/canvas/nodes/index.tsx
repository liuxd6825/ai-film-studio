import { CANVAS_NODE_TYPES } from "../domain/canvasNodes";
import { ImageNode } from "./ImageNode";
import { ImageEditNode } from "./ImageEditNode";
import { StoryboardNode } from "./StoryboardNode";
import { StoryboardGenNode } from "./StoryboardGenNode";
import { ExportImageNode } from "./ExportImageNode";
import { TextAnnotationNode } from "./TextAnnotationNode";
import { GroupNode } from "./GroupNode";
import { VideoGenNode } from "./VideoGenNode";
import { VideoNode } from "./VideoNode";

export {
  ImageNode,
  ImageEditNode,
  StoryboardNode,
  StoryboardGenNode,
  ExportImageNode,
  TextAnnotationNode,
  GroupNode,
  VideoGenNode,
  VideoNode,
};

export const nodeTypes = {
  [CANVAS_NODE_TYPES.upload]: ImageNode,
  [CANVAS_NODE_TYPES.imageEdit]: ImageEditNode,
  [CANVAS_NODE_TYPES.storyboardSplit]: StoryboardNode,
  [CANVAS_NODE_TYPES.storyboardGen]: StoryboardGenNode,
  [CANVAS_NODE_TYPES.exportImage]: ExportImageNode,
  [CANVAS_NODE_TYPES.textAnnotation]: TextAnnotationNode,
  [CANVAS_NODE_TYPES.group]: GroupNode,
  [CANVAS_NODE_TYPES.videoGen]: VideoGenNode,
  [CANVAS_NODE_TYPES.videoUpload]: VideoNode,
};
