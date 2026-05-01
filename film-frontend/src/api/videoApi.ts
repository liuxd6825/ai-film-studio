import { api } from "./client";


export interface VideoProject {
  id: string;
  projectId: string;
  name: string;
  nodes: VideoCanvasNode[];
  edges: VideoCanvasEdge[];
  createdAt: number;
  updatedAt: number;
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

export interface CreateProjectRequest {
  projectId: string;
  name: string;
}

export interface AddNodeRequest {
  type: string;
  position: { x: number; y: number };
  data?: Record<string, unknown>;
}

export interface UpdateNodeRequest {
  nodeId: string;
  data: Record<string, unknown>;
}

export interface GenerateRequest {
  nodeId: string;
  model: string;
}

export interface JobStatus {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  result?: Record<string, unknown>;
  error?: string;
}

export interface ExportResult {
  exportUrl: string;
  projectName: string;
  format: string;
}

export interface GenerateVideoRequest {
  node_id: string;
  canvas_id: string;
  prompt: string;
  model: string;
  aspect_ratio: string;
  fps: number;
  duration: number;
  reference_files?: string[];
}

export interface GenerateVideoResponse {
  task_id: string;
  result_id: string;
  result_url: string;
  status: string;
}

export interface VideoTask {
  id: string;
  type: "image" | "video";
  status: "generating" | "completed" | "failed";
  desc?: string;
  results: string[];
}

export interface VideoResultResponse {
  request_id: string;
  tasks: VideoTask[];
}

export interface VideoAiModel{
  id: string;
  title: string;
}

export const videoApi = {
  createProject: (req: CreateProjectRequest) =>
    api.post<VideoProject>("/api/v1/video/projects", req),

  getProject: (id: string) =>
    api.get<VideoProject>(`/api/v1/video/projects/${id}`),

  updateProject: (id: string, name: string) =>
    api.patch<void>(`/api/v1/video/projects/${id}`, { name }),

  deleteProject: (id: string) =>
    api.delete<void>(`/api/v1/video/projects/${id}`),

  addNode: (projectId: string, req: AddNodeRequest) =>
    api.post<VideoCanvasNode>(`/api/v1/video/projects/${projectId}/nodes`, req),

  updateNode: (projectId: string, req: UpdateNodeRequest) =>
    api.patch<void>(`/api/v1/video/projects/${projectId}/nodes`, req),

  deleteNode: (projectId: string, nodeId: string) =>
    api.delete<void>(`/api/v1/video/projects/${projectId}/nodes/${nodeId}`),

  generate: (projectId: string, req: GenerateRequest) =>
    api.post<{ jobId: string }>(
      `/api/v1/video/projects/${projectId}/generate`,
      req,
    ),

  getJobStatus: (jobId: string) =>
    api.get<JobStatus>(`/api/v1/video/jobs/${jobId}`),

  export: (projectId: string, format: string) =>
    api.post<ExportResult>(`/api/v1/video/projects/${projectId}/export`, {
      format,
    }),

  generateVideo: (projectId: string, data: GenerateVideoRequest) =>
    api.post<GenerateVideoResponse>(
      `/api/v1/projects/${projectId}/videos/generate`,
      data,
    ),

  getVideoResult: (projectId: string, requestId: string) =>
    api.get<VideoResultResponse>(
      `/api/v1/projects/${projectId}/videos/result/${requestId}`,
    ),

  getModels: (projectId: string): Promise<VideoAiModel[]> =>
    api.get<VideoAiModel[]>(`/api/v1/projects/${projectId}/videos/models`),
};