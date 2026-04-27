import { VideoUploadNode } from "./VideoUploadNode";
import { VideoEditNode } from "./VideoEditNode";
import { VideoSplitNode } from "./VideoSplitNode";
import { VideoMergeNode } from "./VideoMergeNode";
import { StoryboardGenNode } from "./StoryboardGenNode";
import { StoryboardNode } from "./StoryboardNode";
import { StoryboardToVideoNode } from "./StoryboardToVideoNode";
import { ExportVideoNode } from "./ExportVideoNode";

export const videoNodeTypes = {
  videoUploadNode: VideoUploadNode,
  videoEditNode: VideoEditNode,
  videoSplitNode: VideoSplitNode,
  videoMergeNode: VideoMergeNode,
  storyboardGenNode: StoryboardGenNode,
  storyboardNode: StoryboardNode,
  storyboardToVideoNode: StoryboardToVideoNode,
  exportVideoNode: ExportVideoNode,
};

export { VideoUploadNode };
export { VideoEditNode };
export { VideoSplitNode };
export { VideoMergeNode };
export { StoryboardGenNode };
export { StoryboardNode };
export { StoryboardToVideoNode };
export { ExportVideoNode };
