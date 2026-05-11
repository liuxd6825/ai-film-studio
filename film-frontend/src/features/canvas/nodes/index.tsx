import { CANVAS_NODE_TYPES, CANVAS_CONTAINER_TYPES } from "../domain/canvasNodes";
import { ImageNode } from "./ImageNode";
import { ImageEditNode } from "./ImageEditNode";
import { StoryboardNode } from "./StoryboardNode";
import { StoryboardGenNode } from "./StoryboardGenNode";
import { ExportImageNode } from "./ExportImageNode";
import { TextAnnotationNode } from "./TextAnnotationNode";
import { GroupNode } from "./GroupNode";
import { ContainerNode } from "./ContainerNode";
import { VideoGenNode } from "./VideoGenNode";
import { VideoNode } from "./VideoNode";
import { TextNode } from "./TextNode";
import { AudioNode } from "./AudioNode";

export {
  ImageNode,
  ImageEditNode,
  StoryboardNode,
  StoryboardGenNode,
  ExportImageNode,
  TextAnnotationNode,
  GroupNode,
  ContainerNode,
  VideoGenNode,
  VideoNode,
  TextNode,
  AudioNode,
};

export const nodeTypes = {
  [CANVAS_NODE_TYPES.upload]: ImageNode,
  [CANVAS_NODE_TYPES.imageEdit]: ImageEditNode,
  [CANVAS_NODE_TYPES.storyboardSplit]: StoryboardNode,
  [CANVAS_NODE_TYPES.storyboardGen]: StoryboardGenNode,
  [CANVAS_NODE_TYPES.exportImage]: ExportImageNode,
  [CANVAS_NODE_TYPES.textAnnotation]: TextAnnotationNode,
  [CANVAS_NODE_TYPES.group]: GroupNode,
  [CANVAS_CONTAINER_TYPES.character]: ContainerNode,
  [CANVAS_CONTAINER_TYPES.scene]: ContainerNode,
  [CANVAS_CONTAINER_TYPES.prop]: ContainerNode,
  [CANVAS_NODE_TYPES.videoGen]: VideoGenNode,
  [CANVAS_NODE_TYPES.videoUpload]: VideoNode,
  [CANVAS_NODE_TYPES.text]: TextNode,
  [CANVAS_NODE_TYPES.audio]: AudioNode,
};
