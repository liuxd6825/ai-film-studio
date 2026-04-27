import { create } from "zustand";
import type { Viewport } from "@xyflow/react";
import { api } from "../api/client";
import { canvasApi } from "../api/canvasApi";
import {
  useCanvasStore,
  type CanvasNode,
  type CanvasEdge,
} from "../features/canvas/stores/canvasStore";

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
const UPSERT_DEBOUNCE_MS = 500;

interface ProjectSummary {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodeCount: number;
}

interface Project extends ProjectSummary {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: Viewport;
  history?: CanvasHistoryState;
}

interface PersistProjectOptions {
  immediate?: boolean;
  debounceMs?: number;
}

interface FlushProjectOptions {
  bypassIdle?: boolean;
}

export interface CanvasHistorySnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface CanvasHistoryState {
  past: CanvasHistorySnapshot[];
  future: CanvasHistorySnapshot[];
}

const queuedProjectUpserts = new Map<string, Project>();
const projectUpsertTimers = new Map<string, ReturnType<typeof setTimeout>>();

function safeParseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function scheduleIdlePersist(task: () => void): void {
  if (typeof globalThis.requestIdleCallback === "function") {
    globalThis.requestIdleCallback(task, { timeout: 1200 });
  } else {
    setTimeout(task, 64);
  }
}

function clearQueuedProjectUpsert(projectId: string): void {
  const timer = projectUpsertTimers.get(projectId);
  if (timer) {
    clearTimeout(timer);
    projectUpsertTimers.delete(projectId);
  }
  queuedProjectUpserts.delete(projectId);
}

function flushProjectUpsert(
  projectId: string,
  options?: FlushProjectOptions,
): void {
  const project = queuedProjectUpserts.get(projectId);
  if (!project) return;

  queuedProjectUpserts.delete(projectId);

  const executePersist = () => {
    const nodesJson = JSON.stringify(project.nodes);
    const edgesJson = JSON.stringify(project.edges);
    const viewportJson = JSON.stringify(project.viewport);
    const historyJson = JSON.stringify(project.history);

    canvasApi
      .saveCanvas(projectId, {
        nodes: nodesJson,
        edges: edgesJson,
        viewport: viewportJson,
        history: historyJson,
      })
      .catch((error) => {
        console.error("Failed to persist canvas:", error);
      });
  };

  if (options?.bypassIdle) {
    executePersist();
    return;
  }

  scheduleIdlePersist(executePersist);
}

function queueProjectUpsert(
  project: Project,
  options?: PersistProjectOptions,
): void {
  const projectId = project.id;
  queuedProjectUpserts.set(projectId, project);

  const existingTimer = projectUpsertTimers.get(projectId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    projectUpsertTimers.delete(projectId);
  }

  const debounceMs = options?.immediate
    ? 0
    : (options?.debounceMs ?? UPSERT_DEBOUNCE_MS);
  if (debounceMs <= 0) {
    flushProjectUpsert(projectId, { bypassIdle: true });
    return;
  }

  const timer = setTimeout(() => {
    projectUpsertTimers.delete(projectId);
    flushProjectUpsert(projectId);
  }, debounceMs);
  projectUpsertTimers.set(projectId, timer);
}

function updateProjectSummary(
  summaries: ProjectSummary[],
  updated: ProjectSummary,
): ProjectSummary[] {
  const next = summaries.map((summary) =>
    summary.id === updated.id ? updated : summary,
  );
  next.sort((a, b) => b.updatedAt - a.updatedAt);
  return next;
}

interface ProjectState {
  projects: ProjectSummary[];
  currentProjectId: string | null;
  currentProject: Project | null;
  isHydrated: boolean;
  isLoading: boolean;

  hydrate: () => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  createProject: (name: string) => string;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  saveCurrentProject: (
    nodes: CanvasNode[],
    edges: CanvasEdge[],
    viewport?: Viewport,
    history?: CanvasHistoryState,
  ) => void;
  getCurrentProject: () => Project | null;
  closeProject: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  currentProject: null,
  isHydrated: false,
  isLoading: false,

  hydrate: async () => {
    if (get().isHydrated) return;

    try {
      const res = await api.get<any[]>("/api/v1/projects");
      const projects: ProjectSummary[] = (res || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        nodeCount: 0,
      }));
      set({
        projects: projects.sort((a, b) => b.updatedAt - a.updatedAt),
        isHydrated: true,
      });
    } catch (error) {
      console.error("Failed to hydrate projects:", error);
      set({ isHydrated: true });
    }
  },

  loadProject: async (projectId: string) => {
    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const data = await canvasApi.getCanvas(projectId);
      const nodes: CanvasNode[] = safeParseJson(data.nodes, []);
      const edges: CanvasEdge[] = safeParseJson(data.edges, []);
      const viewport: Viewport = safeParseJson(data.viewport, DEFAULT_VIEWPORT);
      const history: CanvasHistoryState = safeParseJson(data.history, {
        past: [],
        future: [],
      });

      const project: Project = {
        id: projectId,
        name: `Project ${projectId.slice(0, 8)}`,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        nodeCount: nodes.length,
        nodes,
        edges,
        viewport,
        history,
      };

      set({
        currentProjectId: projectId,
        currentProject: project,
        isLoading: false,
      });

      const canvasStore = useCanvasStore.getState();
      canvasStore.setProjectId(projectId);
      canvasStore.setCanvasData(nodes, edges, history);
      canvasStore.setViewportState(viewport);
    } catch (error) {
      console.error("Failed to load project:", error);
      set({ isLoading: false });
    }
  },

  createProject: (name: string) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const project: Project = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      nodeCount: 0,
      nodes: [],
      edges: [],
      viewport: DEFAULT_VIEWPORT,
    };

    set((state) => ({
      projects: [{ ...project }, ...state.projects],
      currentProjectId: id,
      currentProject: project,
    }));

    queueProjectUpsert(project, { immediate: true });
    return id;
  },

  deleteProject: (id: string) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId:
        state.currentProjectId === id ? null : state.currentProjectId,
      currentProject:
        state.currentProject?.id === id ? null : state.currentProject,
    }));

    clearQueuedProjectUpsert(id);
  },

  renameProject: (id: string, name: string) => {
    const now = Date.now();
    set((state) => {
      const projects = state.projects.map((p) =>
        p.id === id ? { ...p, name, updatedAt: now } : p,
      );
      return {
        projects: projects.sort((a, b) => b.updatedAt - a.updatedAt),
        currentProject:
          state.currentProject?.id === id
            ? { ...state.currentProject, name, updatedAt: now }
            : state.currentProject,
      };
    });
  },

  saveCurrentProject: (nodes, edges, viewport, history) => {
    const { currentProjectId, currentProject } = get();
    if (!currentProjectId || !currentProject) return;

    const nextViewport =
      viewport ?? currentProject.viewport ?? DEFAULT_VIEWPORT;
    const nextHistory = history ?? { past: [], future: [] };
    const nextNodeCount = nodes.length;

    const nextProject: Project = {
      ...currentProject,
      nodes,
      edges,
      viewport: nextViewport,
      history: nextHistory as CanvasHistoryState,
      nodeCount: nextNodeCount,
      updatedAt: Date.now(),
    };

    set((state) => ({
      currentProject: nextProject,
      projects: updateProjectSummary(state.projects, {
        id: nextProject.id,
        name: nextProject.name,
        createdAt: nextProject.createdAt,
        updatedAt: nextProject.updatedAt,
        nodeCount: nextProject.nodeCount,
      }),
    }));

    queueProjectUpsert(nextProject);
  },

  getCurrentProject: () => {
    const { currentProjectId, currentProject } = get();
    if (!currentProjectId || !currentProject) return null;
    if (currentProject.id !== currentProjectId) return null;
    return currentProject;
  },

  closeProject: () => {
    const { currentProjectId, currentProject } = get();
    if (currentProjectId && currentProject) {
      const canvasState = useCanvasStore.getState();
      get().saveCurrentProject(
        canvasState.nodes,
        canvasState.edges,
        canvasState.currentViewport,
        canvasState.history,
      );
    }

    set({
      currentProjectId: null,
      currentProject: null,
    });
  },
}));
