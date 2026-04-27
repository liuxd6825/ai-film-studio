import { create } from "zustand";
import { StoryPage, Board } from "./types";
import { seriesApi } from "./api";
import { storyboardApi } from "../storyboard/api";

interface SeriesState {
  projectId: string | null;
  allStoryPages: StoryPage[];
  selectedStoryPageId: string | null;
  editingStoryPage: StoryPage | null;
  searchQuery: string;
  statusFilter: string | null;
  isLoading: boolean;

  setProjectId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string | null) => void;
  selectStoryPage: (id: string | null) => void;
  setEditingStoryPage: (page: StoryPage | null) => void;
  updateEditingField: <K extends keyof StoryPage>(
    key: K,
    value: StoryPage[K],
  ) => void;
  fetchAllStoryPages: (projectId: string) => Promise<void>;
  createStoryPage: (
    title: string,
    desc: string,
    boardId?: string,
  ) => Promise<StoryPage | null>;
  saveStoryPage: () => Promise<void>;
  deleteStoryPage: (storyPageId: string) => Promise<void>;
}

export const useSeriesStore = create<SeriesState>((set, get) => ({
  projectId: null,
  allStoryPages: [],
  selectedStoryPageId: null,
  editingStoryPage: null,
  searchQuery: "",
  statusFilter: null,
  isLoading: false,

  setProjectId: (id) => set({ projectId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setStatusFilter: (status) => set({ statusFilter: status }),

  selectStoryPage: (id) => {
    const page = id ? get().allStoryPages.find((p) => p.id === id) || null : null;
    set({ selectedStoryPageId: id, editingStoryPage: page });
  },

  setEditingStoryPage: (page) => set({ editingStoryPage: page }),

  updateEditingField: (key, value) =>
    set((state) => ({
      editingStoryPage: state.editingStoryPage
        ? { ...state.editingStoryPage, [key]: value }
        : null,
    })),

  fetchAllStoryPages: async (projectId) => {
    set({ isLoading: true });
    try {
      const storyPages = await seriesApi.getStoryPagesByProject(projectId);
      set({ allStoryPages: storyPages });
    } catch (error) {
      console.error("Failed to fetch story pages:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  createStoryPage: async (title, desc, boardId) => {
    const { projectId, allStoryPages } = get();
    if (!projectId) return null;

    try {
      let targetBoardId = boardId;

      if (!targetBoardId) {
        const boards = await storyboardApi.getBoards(projectId);
        if (boards.length > 0) {
          targetBoardId = boards[0].id;
        } else {
          const newBoard = await storyboardApi.createBoard(projectId, {
            name: "默认看板",
            description: "系列默认看板",
          } as Partial<Board>);
          if (!newBoard) return null;
          targetBoardId = newBoard.id;
        }
      }

      const newPage = await storyboardApi.createStoryPage(
        projectId,
        targetBoardId,
        {
          title,
          desc,
          status: 0,
          storyTime: "日",
          weather: "晴",
        } as Partial<StoryPage>,
      );

      set({ allStoryPages: [...allStoryPages, newPage] });
      return newPage;
    } catch (error) {
      console.error("Failed to create story page:", error);
      return null;
    }
  },

  saveStoryPage: async () => {
    const { editingStoryPage } = get();
    if (!editingStoryPage) return;

    try {
      const updated = await seriesApi.updateStoryPage(
        editingStoryPage.id,
        editingStoryPage,
      );
      set((state) => ({
        allStoryPages: state.allStoryPages.map((p) =>
          p.id === updated.id ? updated : p,
        ),
        selectedStoryPageId: null,
        editingStoryPage: null,
      }));
    } catch (error) {
      console.error("Failed to save story page:", error);
    }
  },

  deleteStoryPage: async (storyPageId) => {
    try {
      await seriesApi.deleteStoryPage(storyPageId);
      set((state) => ({
        allStoryPages: state.allStoryPages.filter((p) => p.id !== storyPageId),
        selectedStoryPageId:
          state.selectedStoryPageId === storyPageId
            ? null
            : state.selectedStoryPageId,
      }));
    } catch (error) {
      console.error("Failed to delete story page:", error);
    }
  },
}));
