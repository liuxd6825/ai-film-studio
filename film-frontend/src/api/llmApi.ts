import { api } from "./client";

export interface LLMGenerateRequest {
  canvasId: string;
  nodeId: string;
  prompt: string;
  model?: string;
  agentId?: string;
  referenceImages?: string[];
  promptType?: string;
}

export interface LLMModel {
  id: string;
  title: string;
}

export interface PromptType {
  id: string;
  title: string;
}

export const llmApi = {
  getModels: (projectId: string): Promise<LLMModel[]> =>
    api.get<LLMModel[]>(`/api/v1/projects/${projectId}/llm/models`),
  getPromptTypes: (projectId: string): Promise<PromptType[]> =>
    api.get<PromptType[]>(`/api/v1/projects/${projectId}/llm/prompt-types`),
  generate: (projectId: string, req: LLMGenerateRequest): Promise<string> =>
    api.post<{ content: string }>(`/api/v1/projects/${projectId}/llm/generate`, req)
      .then((res) => res.content),
};