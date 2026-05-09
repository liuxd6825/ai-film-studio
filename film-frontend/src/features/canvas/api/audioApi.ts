import { api } from "../../../api/client";

export interface AudioModel {
  id: string;
  title: string;
}

export interface Voice {
  id: string;
  title: string;
}

export interface AudioGenerateRequest {
  canvasId: string;
  nodeId: string;
  prompt: string;
  model: string;
  voice?: string;
}

export interface AudioTask {
  id: string;
  status: string;
  resultUrl?: string;
  errorMessage?: string;
}

export const audioApi = {
  generate: (projectId: string, req: AudioGenerateRequest): Promise<AudioTask> =>
    api.post(`/api/v1/projects/${projectId}/audio/generate`, req),

  getModels: (projectId: string): Promise<AudioModel[]> =>
    api.get(`/api/v1/projects/${projectId}/audio/models`),

  getVoices: (projectId: string): Promise<Voice[]> =>
    api.get(`/api/v1/projects/${projectId}/audio/voices`),

  getTask: (projectId: string, taskId: string): Promise<AudioTask> =>
    api.get(`/api/v1/projects/${projectId}/audio/task?taskId=${taskId}`),
};