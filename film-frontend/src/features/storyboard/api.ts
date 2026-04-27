import { api } from "@/api/client";
import {
  Board,
  StoryPage,
  Shot,
  Keyframe,
  AnalyzeResult,
  GenerateResult,
} from "./types";

export const storyboardApi = {
  // Board APIs
  getBoards: (projectId: string) =>
    api.get<Board[]>(`/api/v1/projects/${projectId}/boards/`),
  createBoard: (projectId: string, data: Partial<Board>) =>
    api.post<Board>(`/api/v1/projects/${projectId}/boards/`, data),

  // StoryPage APIs (via Board)
  getStoryPagesByBoard: (projectId: string, boardId: string) =>
    api.get<StoryPage[]>(
      `/api/v1/projects/${projectId}/boards/${boardId}/story_pages`,
    ),
  createStoryPage: (
    projectId: string,
    boardId: string,
    data: Partial<StoryPage>,
  ) =>
    api.post<StoryPage>(
      `/api/v1/projects/${projectId}/boards/${boardId}/story_pages`,
      data,
    ),

  // Shot APIs
  getShotsByStoryPage: (projectId: string, storyPageId: string) =>
    api.get<Shot[]>(
      `/api/v1/projects/${projectId}/story_pages/${storyPageId}/shots`,
    ),
  createShot: (projectId: string, storyPageId: string, data: Partial<Shot>) =>
    api.post<Shot>(
      `/api/v1/projects/${projectId}/story_pages/${storyPageId}/shots`,
      data,
    ),
  createShotsBatch: (
    projectId: string,
    storyPageId: string,
    shots: Partial<Shot>[],
  ) =>
    api.post<Shot[]>(
      `/api/v1/projects/${projectId}/story_pages/${storyPageId}/shots/batch`,
      { shots },
    ),
  updateShot: (shotId: string, data: Partial<Shot>) =>
    api.put<Shot>(`/api/v1/shots/${shotId}`, data),
  deleteShot: (shotId: string) => api.delete(`/api/v1/shots/${shotId}`),
  deleteShotsBatch: (ids: string[]) =>
    api.delete("/api/v1/shots/batch", { ids }),

  // Keyframe APIs
  getKeyframesByShot: (shotId: string) =>
    api.get<Keyframe[]>(`/api/v1/shots/${shotId}/keyframes`),
  createKeyframe: (shotId: string, data: Record<string, unknown>) =>
    api.post<Keyframe>(`/api/v1/shots/${shotId}/keyframes`, data),
  updateKeyframe: (keyframeId: string, data: Partial<Keyframe>) =>
    api.put<Keyframe>(`/api/v1/keyframes/${keyframeId}`, data),
  deleteKeyframe: (keyframeId: string) =>
    api.delete(`/api/v1/keyframes/${keyframeId}`),
  generateKeyframesFromScript: (shotId: string, data: {
    agentId: string;
    projectId: string;
    shotId: string;
  }) => api.post<Keyframe[]>(`/api/v1/shots/${shotId}/keyframes/generate`, data),
  batchUpdateKeyframes: (
    keyframes: {
      id: string;
      shotId: string;
      orderNum: number;
      frameNumber: number;
    }[],
  ) => api.put("/api/v1/keyframes/batch", { keyframes }),

  analyzeStoryPage: (
    storyPageId: string,
    data: {
      documentId?: string;
      content?: string;
      maxDuration: number;
      projectId: string;
    },
  ) =>
    api.post<AnalyzeResult>(`/api/v1/story_pages/${storyPageId}/analyze`, data),

  generateFromScript: (data: {
    agentId: string;
    projectId: string;
    scriptSegment: string;
  }) => api.post<GenerateResult>("/api/v1/shots/generate_from_script", data),
};
