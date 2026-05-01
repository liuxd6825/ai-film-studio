import { api } from "./client";

export interface GenerateImageRequest {
  prompt: string;
  model?: string;
  size?: "1K" | "2K" | "4K";
  quality?: "standard" | "hd";
  n?: number;
  referenceImages?: string[];
  aspectRatio?: string;
  canvasId?: string;
  nodeId?: string;
}

export interface GenerateImageResponse {
  id: string;
  taskId?: string;
  imageUrl: string;
  imageData?: string;
  aspectRatio: string;
  processingTimeMs: number;
  model: string;
  provider: string;
}

export interface ImageAiModel {
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
};
