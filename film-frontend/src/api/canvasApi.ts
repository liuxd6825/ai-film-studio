import { api } from "./client";

export interface CanvasData {
  id: string;
  projectId: string;
  name: string;
  creatorId: string;
  nodes: string;
  edges: string;
  viewport: string;
  history: string;
  createdAt: number;
  updatedAt: number;
}

export interface SaveCanvasRequest {
  name?: string;
  nodes: string;
  edges: string;
  viewport: string;
  history: string;
}

export interface CreateCanvasRequest {
  name: string;
}

export interface UpdateCanvasRequest {
  name: string;
}

export interface ListCanvasesResponse {
  canvases: CanvasData[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListCanvasesParams {
  name?: string;
  startDate?: number;
  endDate?: number;
  page?: number;
  pageSize?: number;
}

export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  width?: number;
  height?: number;
  measured?: { width?: number; height?: number };
  selected?: boolean;
  parentId?: string;
  extent?: string;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodeCount: number;
}

export const canvasApi = {
  list: (projectId: string, params?: ListCanvasesParams) => {
    const searchParams = new URLSearchParams();
    if (params?.name) searchParams.set("name", params.name);
    if (params?.startDate) searchParams.set("startDate", String(params.startDate));
    if (params?.endDate) searchParams.set("endDate", String(params.endDate));
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    const query = searchParams.toString();
    return api.get<ListCanvasesResponse>(
      `/api/v1/projects/${projectId}/canvases${query ? `?${query}` : ""}`
    );
  },

  create: (projectId: string, data: CreateCanvasRequest) =>
    api.post<CanvasData>(`/api/v1/projects/${projectId}/canvases`, data),

  get: (projectId: string, canvasId: string) =>
    api.get<CanvasData>(`/api/v1/projects/${projectId}/canvases/${canvasId}`),

  update: (projectId: string, canvasId: string, data: UpdateCanvasRequest) =>
    api.put<{ code: number; message: string }>(
      `/api/v1/projects/${projectId}/canvases/${canvasId}`,
      data
    ),

  delete: (projectId: string, canvasId: string) =>
    api.delete<{ code: number; message: string }>(
      `/api/v1/projects/${projectId}/canvases/${canvasId}`
    ),

  save: (projectId: string, canvasId: string, data: SaveCanvasRequest) =>
    api.put<void>(
      `/api/v1/projects/${projectId}/canvases/${canvasId}/save`,
      data
    ),

  getCanvas: (projectId: string) =>
    api.get<CanvasData>(`/api/v1/projects/${projectId}/canvas`),

  saveCanvas: (projectId: string, data: SaveCanvasRequest) =>
    api.put<void>(`/api/v1/projects/${projectId}/canvas`, data),
};
