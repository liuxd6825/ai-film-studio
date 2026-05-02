import { api } from "./client";

export interface LLMModel {
  id: string;
  title: string;
}

export const llmApi = {
  getModels: (projectId: string): Promise<LLMModel[]> =>
    api.get<LLMModel[]>(`/api/v1/projects/${projectId}/llm/models`),
};