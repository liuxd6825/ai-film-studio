import {
  CANVAS_NODE_TYPES,
  DEFAULT_ASPECT_RATIO,
  type ImageSize,
  type CanvasNodeData,
  type CanvasNodeType,
  type ExportImageNodeData,
  type GroupNodeData,
  type ImageEditNodeData,
  type StoryboardSplitNodeData,
  type StoryboardGenNodeData,
  type TextAnnotationNodeData,
  type UploadImageNodeData,
  type VideoGenNodeData,
  type VideoUploadNodeData,
  type TextNodeData,
} from "./canvasNodes";

export type MenuIconKey = "upload" | "sparkles" | "layout" | "text";

export interface CanvasNodeCapabilities {
  toolbar: boolean;
  promptInput: boolean;
}

export interface CanvasNodeConnectivity {
  sourceHandle: boolean;
  targetHandle: boolean;
  connectMenu: {
    fromSource: boolean;
    fromTarget: boolean;
  };
}

export interface CanvasNodeDefinition<
  TData extends CanvasNodeData = CanvasNodeData,
> {
  type: CanvasNodeType;
  menuLabelKey: string;
  menuIcon: MenuIconKey;
  visibleInMenu: boolean;
  capabilities: CanvasNodeCapabilities;
  connectivity: CanvasNodeConnectivity;
  createDefaultData: () => TData;
}

const uploadNodeDefinition: CanvasNodeDefinition<UploadImageNodeData> = {
  type: CANVAS_NODE_TYPES.upload,
  menuLabelKey: "node.menu.uploadImage",
  menuIcon: "upload",
  visibleInMenu: false,
  capabilities: {
    toolbar: true,
    promptInput: false,
  },
  connectivity: {
    sourceHandle: true,
    targetHandle: false,
    connectMenu: {
      fromSource: false,
      fromTarget: true,
    },
  },
  createDefaultData: () => ({
    displayName: "",
    imageUrl: null,
    previewImageUrl: null,
    aspectRatio: "1:1",
    isSizeManuallyAdjusted: false,
    sourceFileName: null,
  }),
};

const imageEditNodeDefinition: CanvasNodeDefinition<ImageEditNodeData> = {
  type: CANVAS_NODE_TYPES.imageEdit,
  menuLabelKey: "node.menu.aiImageGeneration",
  menuIcon: "sparkles",
  visibleInMenu: true,
  capabilities: {
    toolbar: true,
    promptInput: false,
  },
  connectivity: {
    sourceHandle: true,
    targetHandle: true,
    connectMenu: {
      fromSource: true,
      fromTarget: true,
    },
  },
  createDefaultData: () => ({
    displayName: "",
    imageUrl: null,
    previewImageUrl: null,
    aspectRatio: DEFAULT_ASPECT_RATIO,
    isSizeManuallyAdjusted: false,
    requestAspectRatio: "16:9",
    prompt: "",
    workMode: "text-to-image",
    aiModel: "dall-e-2",
    size: "2K" as ImageSize,
    extraParams: {},
    isGenerating: false,
    generationStartedAt: null,
    generationDurationMs: 60000,
    mode: 'undecided' as const,
  }),
};

const exportImageNodeDefinition: CanvasNodeDefinition<ExportImageNodeData> = {
  type: CANVAS_NODE_TYPES.exportImage,
  menuLabelKey: "node.menu.exportImage",
  menuIcon: "upload",
  visibleInMenu: false,
  capabilities: {
    toolbar: true,
    promptInput: false,
  },
  connectivity: {
    sourceHandle: true,
    targetHandle: true,
    connectMenu: {
      fromSource: false,
      fromTarget: false,
    },
  },
  createDefaultData: () => ({
    displayName: "",
    imageUrl: null,
    previewImageUrl: null,
    aspectRatio: DEFAULT_ASPECT_RATIO,
    isSizeManuallyAdjusted: false,
    resultKind: "generic",
  }),
};

const groupNodeDefinition: CanvasNodeDefinition<GroupNodeData> = {
  type: CANVAS_NODE_TYPES.group,
  menuLabelKey: "node.menu.storyboard",
  menuIcon: "layout",
  visibleInMenu: false,
  capabilities: {
    toolbar: false,
    promptInput: false,
  },
  connectivity: {
    sourceHandle: false,
    targetHandle: false,
    connectMenu: {
      fromSource: false,
      fromTarget: false,
    },
  },
  createDefaultData: () => ({
    displayName: "",
    label: "",
  }),
};

const textAnnotationNodeDefinition: CanvasNodeDefinition<TextAnnotationNodeData> =
  {
    type: CANVAS_NODE_TYPES.textAnnotation,
    menuLabelKey: "node.menu.textAnnotation",
    menuIcon: "text",
    visibleInMenu: true,
    capabilities: {
      toolbar: true,
      promptInput: false,
    },
    connectivity: {
      sourceHandle: false,
      targetHandle: false,
      connectMenu: {
        fromSource: false,
        fromTarget: false,
      },
    },
    createDefaultData: () => ({
      displayName: "",
      content: "",
    }),
  };

const storyboardSplitDefinition: CanvasNodeDefinition<StoryboardSplitNodeData> =
  {
    type: CANVAS_NODE_TYPES.storyboardSplit,
    menuLabelKey: "node.menu.storyboard",
    menuIcon: "layout",
    visibleInMenu: false,
    capabilities: {
      toolbar: false,
      promptInput: false,
    },
    connectivity: {
      sourceHandle: true,
      targetHandle: true,
      connectMenu: {
        fromSource: false,
        fromTarget: false,
      },
    },
    createDefaultData: () => ({
      displayName: "",
      aspectRatio: DEFAULT_ASPECT_RATIO,
      frameAspectRatio: DEFAULT_ASPECT_RATIO,
      gridRows: 2,
      gridCols: 2,
      frames: [],
      exportOptions: {
        showFrameIndex: false,
        showFrameNote: false,
        notePlacement: "overlay",
        imageFit: "cover",
        frameIndexPrefix: "S",
        cellGap: 8,
        outerPadding: 0,
        fontSize: 4,
        backgroundColor: "#0f1115",
        textColor: "#f8fafc",
      },
    }),
  };

const storyboardGenNodeDefinition: CanvasNodeDefinition<StoryboardGenNodeData> =
  {
    type: CANVAS_NODE_TYPES.storyboardGen,
    menuLabelKey: "node.menu.storyboardGen",
    menuIcon: "sparkles",
    visibleInMenu: true,
    capabilities: {
      toolbar: true,
      promptInput: false,
    },
    connectivity: {
      sourceHandle: true,
      targetHandle: true,
      connectMenu: {
        fromSource: true,
        fromTarget: false,
      },
    },
    createDefaultData: () => ({
      displayName: "",
      gridRows: 2,
      gridCols: 2,
      frames: [],
      ratioControlMode: "cell",
      model: "dall-e-2",
      size: "2K" as ImageSize,
      requestAspectRatio: "16:9",
      extraParams: {},
      imageUrl: null,
      previewImageUrl: null,
      aspectRatio: DEFAULT_ASPECT_RATIO,
      isGenerating: false,
      generationStartedAt: null,
      generationDurationMs: 60000,
    }),
  };

const videoGenNodeDefinition: CanvasNodeDefinition<VideoGenNodeData> = {
  type: CANVAS_NODE_TYPES.videoGen,
  menuLabelKey: "node.menu.videoGen",
  menuIcon: "sparkles",
  visibleInMenu: true,
  capabilities: {
    toolbar: true,
    promptInput: false,
  },
  connectivity: {
    sourceHandle: true,
    targetHandle: true,
    connectMenu: {
      fromSource: true,
      fromTarget: true,
    },
  },
  createDefaultData: () => ({
    displayName: "",
    prompt: "",
    aspectRatio: "16:9",
    resolution: "1080p",
    fps: 30,
    duration: 5,
    aiModel: "veo",
    videoUrl: null,
    previewVideoUrl: null,
    taskStatus: "idle",
    taskProgress: 0,
    mode: 'undecided',
  }),
};

const videoUploadNodeDefinition: CanvasNodeDefinition<VideoUploadNodeData> = {
  type: CANVAS_NODE_TYPES.videoUpload,
  menuLabelKey: "node.menu.videoUpload",
  menuIcon: "upload",
  visibleInMenu: false,
  capabilities: {
    toolbar: true,
    promptInput: false,
  },
  connectivity: {
    sourceHandle: true,
    targetHandle: false,
    connectMenu: {
      fromSource: true,
      fromTarget: false,
    },
  },
  createDefaultData: () => ({
    displayName: "",
    videoUrl: null,
    previewVideoUrl: null,
    sourceFileName: "",
  }),
};

const textNodeDefinition: CanvasNodeDefinition<TextNodeData> = {
  type: CANVAS_NODE_TYPES.text,
  menuLabelKey: "node.menu.text",
  menuIcon: "text",
  visibleInMenu: true,
  capabilities: {
    toolbar: true,
    promptInput: false,
  },
  connectivity: {
    sourceHandle: true,
    targetHandle: true,
    connectMenu: {
      fromSource: true,
      fromTarget: true,
    },
  },
  createDefaultData: () => ({
    displayName: "",
    content: "",
    prompt: "",
    aiModel: "veo",
  }),
};

export const canvasNodeDefinitions: Record<
  CanvasNodeType,
  CanvasNodeDefinition
> = {
  [CANVAS_NODE_TYPES.text]: textNodeDefinition,
  [CANVAS_NODE_TYPES.upload]: uploadNodeDefinition,
  [CANVAS_NODE_TYPES.videoUpload]: videoUploadNodeDefinition,
  [CANVAS_NODE_TYPES.imageEdit]: imageEditNodeDefinition,
  [CANVAS_NODE_TYPES.videoGen]: videoGenNodeDefinition,
  [CANVAS_NODE_TYPES.exportImage]: exportImageNodeDefinition,
  [CANVAS_NODE_TYPES.textAnnotation]: textAnnotationNodeDefinition,
  [CANVAS_NODE_TYPES.group]: groupNodeDefinition,
  [CANVAS_NODE_TYPES.storyboardSplit]: storyboardSplitDefinition,
  [CANVAS_NODE_TYPES.storyboardGen]: storyboardGenNodeDefinition,



};

export function getNodeDefinition(type: CanvasNodeType): CanvasNodeDefinition {
  return canvasNodeDefinitions[type];
}

export function getMenuNodeDefinitions(): CanvasNodeDefinition[] {
  return Object.values(canvasNodeDefinitions).filter(
    (definition) => definition.visibleInMenu,
  );
}

export function nodeHasSourceHandle(type: CanvasNodeType): boolean {
  return canvasNodeDefinitions[type].connectivity.sourceHandle;
}

export function nodeHasTargetHandle(type: CanvasNodeType): boolean {
  return canvasNodeDefinitions[type].connectivity.targetHandle;
}

export function getConnectMenuNodeTypes(
  handleType: "source" | "target",
): CanvasNodeType[] {
  const fromSource = handleType === "source";
  return Object.values(canvasNodeDefinitions)
    .filter((definition) =>
      fromSource
        ? definition.connectivity.connectMenu.fromSource
        : definition.connectivity.connectMenu.fromTarget,
    )
    .filter((definition) =>
      fromSource
        ? definition.connectivity.targetHandle
        : definition.connectivity.sourceHandle,
    )
    .map((definition) => definition.type);
}
