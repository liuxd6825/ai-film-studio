import { create } from "zustand";
import { Prompt, PromptVariable, PromptCategory } from "../api/promptApi";

interface PromptState {
  prompts: Prompt[];
  categories: PromptCategory[];
  selectedPrompt: Prompt | null;
  selectedCategoryId: string | null;
  searchKeyword: string;
  detailModalOpen: boolean;
  versions: Array<{ version: number; content: string; createdAt: number }>;
  variableValues: Record<string, string>;
  renderedContent: string;

  setPrompts: (prompts: Prompt[]) => void;
  setCategories: (categories: PromptCategory[]) => void;
  setSelectedPrompt: (prompt: Prompt | null) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setSearchKeyword: (keyword: string) => void;
  setDetailModalOpen: (open: boolean) => void;
  setVersions: (versions: any[]) => void;
  setVariableValue: (name: string, value: string) => void;
  setRenderedContent: (content: string) => void;
  resetVariableValues: (variables: PromptVariable[]) => void;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  categories: [],
  selectedPrompt: null,
  selectedCategoryId: null,
  searchKeyword: "",
  detailModalOpen: false,
  versions: [],
  variableValues: {},
  renderedContent: "",

  setPrompts: (prompts) => set({ prompts }),

  setCategories: (categories) => set({ categories }),

  setSelectedPrompt: (prompt) => {
    set({
      selectedPrompt: prompt,
      variableValues: {},
      renderedContent: prompt?.content || "",
    });
    if (prompt?.variables) {
      const defaults: Record<string, string> = {};
      prompt.variables.forEach((v) => {
        if (v.default) defaults[v.name] = v.default;
      });
      set({ variableValues: defaults });
    }
  },

  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  setDetailModalOpen: (open) => set({ detailModalOpen: open }),

  setVersions: (versions) => set({ versions }),

  setVariableValue: (name, value) => {
    const newValues = { ...get().variableValues, [name]: value };
    set({ variableValues: newValues });

    const prompt = get().selectedPrompt;
    if (prompt) {
      let content = prompt.content;
      Object.entries(newValues).forEach(([k, v]) => {
        content = content.replace(new RegExp(`{{${k}}}`, "g"), v);
      });
      set({ renderedContent: content });
    }
  },

  setRenderedContent: (renderedContent) => set({ renderedContent }),

  resetVariableValues: (variables) => {
    const defaults: Record<string, string> = {};
    variables.forEach((v) => {
      if (v.default) defaults[v.name] = v.default;
    });
    set({ variableValues: defaults });
  },
}));
