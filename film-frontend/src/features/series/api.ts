import { api } from "@/api/client";
import { StoryPage } from "./types";

export const seriesApi = {
  getStoryPagesByProject: (projectId: string) =>
    api.get<StoryPage[]>(`/api/v1/projects/${projectId}/story_pages`),

  getStoryPage: (storyPageId: string) =>
    api.get<StoryPage>(`/api/v1/story_pages/${storyPageId}`),

  updateStoryPage: (storyPageId: string, data: Partial<StoryPage>) =>
    api.put<StoryPage>(`/api/v1/story_pages/${storyPageId}`, data),

  deleteStoryPage: (storyPageId: string) =>
    api.delete(`/api/v1/story_pages/${storyPageId}`),
};
