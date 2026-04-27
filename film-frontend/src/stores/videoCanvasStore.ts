import { create } from "zustand";

export interface VideoFrame {
  id: string;
  imageUrl: string | null;
  index: number;
  timestamp: number;
  note?: string;
}

export interface StoryboardFrame {
  id: string;
  description: string;
  imageUrl: string | null;
  order: number;
  duration?: number;
}

export interface VideoCanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface VideoCanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface PlaybackState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  activeNodeId: string | null;
}

interface VideoCanvasState {
  nodes: VideoCanvasNode[];
  edges: VideoCanvasEdge[];
  selectedNodeId: string | null;
  playbackState: PlaybackState;

  addNode: (type: string, position: { x: number; y: number }) => string;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  updateNodePosition: (
    nodeId: string,
    position: { x: number; y: number },
  ) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setPlaybackState: (state: Partial<PlaybackState>) => void;
  addEdge: (source: string, target: string) => boolean;
  deleteEdge: (edgeId: string) => void;
}

export const useVideoCanvasStore = create<VideoCanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  playbackState: {
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    activeNodeId: null,
  },

  addNode: (type, position) => {
    const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNode: VideoCanvasNode = {
      id,
      type,
      position,
      data: { videoUrl: null, frames: [] },
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
    return id;
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node,
      ),
    }));
  },

  updateNodePosition: (nodeId, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, position } : node,
      ),
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
      selectedNodeId:
        state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setPlaybackState: (state) => {
    set((prev) => ({
      playbackState: { ...prev.playbackState, ...state },
    }));
  },

  addEdge: (source, target) => {
    if (source === target) {
      return false;
    }
    const state = get();
    const exists = state.edges.some(
      (edge) => edge.source === source && edge.target === target,
    );
    if (exists) {
      return false;
    }
    const id = `edge-${source}-${target}`;
    const newEdge: VideoCanvasEdge = { id, source, target };
    set((state) => ({ edges: [...state.edges, newEdge] }));
    return true;
  },

  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    }));
  },
}));
