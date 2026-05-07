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
  categoryKey: string;
  tags: string;
  variables: PromptVariable[];
  version: number;
  isLatest: boolean;
  isSystem: boolean;
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
  key: string;
  name: string;
  description: string;
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
  list: (projectId: string, categoryKey?: string, tag?: string) => {
    const params = new URLSearchParams({ projectId });
    if (categoryKey) params.append("categoryKey", categoryKey);
    if (tag) params.append("tag", tag);
    return api.get<Prompt[]>(`/api/v1/prompts?${params}`).then(parsePromptList);
  },

  listByCategory: (projectId: string, categoryKey: string) => {
    return api.get<any[]>(`/api/v1/prompt-category/${categoryKey}/prompts?projectId=${projectId}`).then((data): Prompt[] => {
      if (!data || !Array.isArray(data)) return [];
      return data.map(p => ({
        ...p,
        content: "",
        variables: typeof p.variables === "string" ? JSON.parse(p.variables || "[]") : p.variables || [],
      }));
    });
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
  list: () => {
    return api.get<PromptCategory[]>(`/api/v1/prompt-categories`);
  },
};

export const PROMPT_CATEGORIES: PromptCategory[] = [
  { key: "conversation", name: "会话", description: "对话类提示词" },
  { key: "canvas_text", name: "画布文字", description: "画布文本节点提示词" },
  { key: "canvas_image", name: "画布图片", description: "画布图片生成提示词" },
  { key: "canvas_video", name: "画布视频", description: "画布视频生成提示词" },
];