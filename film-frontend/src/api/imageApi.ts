import { api } from "./client";

export interface GenerateImageRequest {
  prompt: string;
  model?: string;
  resolution?: "1K" | "2K" | "4K";
  referenceImages?: string[];
  aspectRatio?: string;
  canvasId?: string;
  nodeId?: string;
  promptType?: string;
}

export interface GenerateImageResponse {
  id: string;
  model: string;
  provider: string;
}

export interface ImageAiModel {
  id: string;
  title: string;
}

export interface PromptType {
  id: string;
  title: string;
}

export const imageApi = {
  generate: (projectId: string, data: GenerateImageRequest) =>
    api.post<GenerateImageResponse>(
      `/api/v1/projects/${projectId}/images/generate`,
      data,
    ),

  getModels: (projectId: string): Promise<ImageAiModel[]> =>
    api.get<ImageAiModel[]>(`/api/v1/projects/${projectId}/images/models`),

  getPromptTypes: (projectId: string): Promise<PromptType[]> =>
    api.get<PromptType[]>(`/api/v1/projects/${projectId}/images/prompt-types`),
};
