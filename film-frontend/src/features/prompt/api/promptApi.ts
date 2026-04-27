import { api } from "../../../api/client";

export interface PromptVariable {
  name: string;
  type: "short_text" | "long_text" | "enum";
  description?: string;
  default?: string;
  options?: string[];
}

export interface Prompt {
  id: string;
  projectId: string;
  title: string;
  content: string;
  categoryId: string;
  tags: string;
  variables: PromptVariable[];
  version: number;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  content: string;
  createdAt: string;
}

export interface PromptCategory {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
}

const parsePrompt = (p: any): Prompt => ({
  ...p,
  variables:
    typeof p.variables === "string"
      ? JSON.parse(p.variables || "[]")
      : p.variables || [],
});

const parsePromptList = (list: any[]): Prompt[] => list.map(parsePrompt);

export const promptApi = {
  list: (projectId: string, categoryId?: string, tag?: string) => {
    const params = new URLSearchParams({ projectId });
    if (categoryId) params.append("categoryId", categoryId);
    if (tag) params.append("tag", tag);
    return api.get<Prompt[]>(`/api/v1/prompts?${params}`).then(parsePromptList);
  },

  get: (id: string) =>
    api.get<Prompt>(`/api/v1/prompts/${id}`).then(parsePrompt),

  create: (data: Partial<Prompt>) =>
    api.post<Prompt>("/api/v1/prompts", data).then(parsePrompt),

  update: (id: string, data: Partial<Prompt>) =>
    api.put<Prompt>(`/api/v1/prompts/${id}`, data).then(parsePrompt),

  delete: (id: string) => api.delete(`/api/v1/prompts/${id}`),

  getVersions: (id: string) =>
    api.get<PromptVersion[]>(`/api/v1/prompts/${id}/versions`),

  restoreVersion: (id: string, version: number) =>
    api
      .post<Prompt>(`/api/v1/prompts/${id}/restore/${version}`)
      .then(parsePrompt),
};

export const categoryApi = {
  list: (projectId: string) => {
    const params = new URLSearchParams({ projectId });
    return api.get<PromptCategory[]>(`/api/v1/prompt-categories?${params}`);
  },

  get: (id: string) =>
    api.get<PromptCategory>(`/api/v1/prompt-categories/${id}`),

  create: (data: { projectId: string; name: string }) =>
    api.post<PromptCategory>("/api/v1/prompt-categories", data),

  update: (id: string, data: { name: string }) =>
    api.put<PromptCategory>(`/api/v1/prompt-categories/${id}`, data),

  delete: (id: string) => api.delete(`/api/v1/prompt-categories/${id}`),
};
