import { create } from "zustand";
import { Board, StoryPage, Shot, Keyframe } from "./types";
import { storyboardApi } from "./api";

interface StoryboardState {
  projectId: string | null;
  boards: Board[];
  currentBoardId: string | null;
  storyPages: StoryPage[];
  shots: Shot[];
  keyframes: Keyframe[];
  isShotsLoading: boolean;
  selectedShotIds: string[];
  viewMode: "edit" | "browse";

  selectedStoryPageId: string | null;
  activePromptId: string | null;
  activeVideoPromptId: string | null;
  showShotNav: boolean;
  shotNavPage: number;
  collapsedShotIds: Set<string>;
  editingKeyframe: Keyframe | null;
  editingKeyframeDraft: Keyframe | null;
  editingShot: Shot | null;
  inputMedia: string[];
  savedMedia: string[];
  showStoryPageSelectDialog: boolean;

  openStoryPageSelectDialog: () => void;
  closeStoryPageSelectDialog: () => void;

  fetchBoards: (projectId: string) => Promise<void>;
  setProjectId: (id: string | null) => void;
  createBoard: (
    projectId: string,
    data: Partial<Board>,
  ) => Promise<Board | null>;
  setCurrentBoardId: (id: string | null) => void;
  setViewMode: (mode: "edit" | "browse") => void;
  setStoryPages: (pages: StoryPage[]) => void;
  setShots: (shots: Shot[] | ((prev: Shot[]) => Shot[])) => void;
  setKeyframes: (
    keyframes: Keyframe[] | ((prev: Keyframe[]) => Keyframe[]),
  ) => void;
  updateKeyframe: (id: string, updates: Partial<Keyframe>) => void;
  setSelectedStoryPageId: (id: string | null) => void;
  setActivePromptId: (id: string | null) => void;
  setActiveVideoPromptId: (id: string | null) => void;
  setShowShotNav: (show: boolean) => void;
  setShotNavPage: (page: number | ((prev: number) => number)) => void;
  toggleShotCollapsed: (shotId: string) => void;
  setAllShotsCollapsed: (collapsed: boolean) => void;
  setEditingKeyframe: (kf: Keyframe | null) => void;
  setEditingShot: (shot: Shot | null) => void;
  setInputMedia: (media: string[] | ((prev: string[]) => string[])) => void;
  setSavedMedia: (media: string[] | ((prev: string[]) => string[])) => void;

  openKeyframeEdit: (kf: Keyframe) => void;
  updateEditingKeyframeDraft: (updates: Partial<Keyframe>) => void;
  commitKeyframeEdit: () => void;
  cancelKeyframeEdit: () => void;

  fetchStoryPagesByBoard: (projectId: string, boardId: string) => Promise<void>;
  createStoryPage: (
    projectId: string,
    boardId: string,
    data: Partial<StoryPage>,
  ) => Promise<StoryPage | null>;
  fetchShotsByStoryPage: (
    projectId: string,
    storyPageId: string,
  ) => Promise<void>;
  setIsShotsLoading: (loading: boolean) => void;
  createShot: (
    projectId: string,
    storyPageId: string,
    data: Partial<Shot>,
  ) => Promise<Shot | null>;
  updateShot: (shotId: string, data: Partial<Shot>) => Promise<Shot | null>;
  deleteShot: (shotId: string) => Promise<void>;
  toggleShotSelection: (shotId: string) => void;
  clearShotSelection: () => void;
  deleteSelectedShotsAPI: () => Promise<void>;
  fetchKeyframesByShot: (shotId: string) => Promise<void>;
  createKeyframe: (
    shotId: string,
    data: Record<string, unknown>,
  ) => Promise<Keyframe | null>;
  updateKeyframeAPI: (
    keyframeId: string,
    data: Partial<Keyframe>,
  ) => Promise<void>;
  deleteKeyframeAPI: (keyframeId: string) => Promise<void>;
  batchUpdateKeyframesAPI: (
    keyframes: {
      id: string;
      shotId: string;
      orderNum: number;
      frameNumber: number;
    }[],
  ) => Promise<void>;
  generateKeyframesAI: (shotId: string) => Promise<Keyframe[] | null>;
}

export const useStoryboardStore = create<StoryboardState>((set, get) => ({
  projectId: null,
  boards: [],
  currentBoardId: null,
  storyPages: [],
  shots: [],
  keyframes: [],
  isShotsLoading: false,
  selectedShotIds: [],
  viewMode: "edit",

  selectedStoryPageId: null,
  activePromptId: null,
  activeVideoPromptId: null,
  showShotNav: true,
  shotNavPage: 0,
  collapsedShotIds: new Set<string>(),
  editingKeyframe: null,
  editingKeyframeDraft: null,
  editingShot: null,
  inputMedia: [],
  savedMedia: [],
  showStoryPageSelectDialog: false,

  openStoryPageSelectDialog: () => set({ showStoryPageSelectDialog: true }),
  closeStoryPageSelectDialog: () => set({ showStoryPageSelectDialog: false }),

  fetchBoards: async (projectId) => {
    console.log("fetchBoards called with projectId:", projectId);
    try {
      console.log("Calling API:", `/api/v1/projects/${projectId}/boards`);
      const boards = await storyboardApi.getBoards(projectId);
      console.log("fetchBoards result:", boards);
      set({ boards });
      if (boards.length > 0) {
        console.log("Setting currentBoardId to:", boards[0].id);
        set({ currentBoardId: boards[0].id });
        get().fetchStoryPagesByBoard(projectId, boards[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch boards:", error);
    }
  },

  setProjectId: (id) => set({ projectId: id }),

  createBoard: async (projectId, data) => {
    try {
      const board = await storyboardApi.createBoard(projectId, data);
      set((state) => ({ boards: [...state.boards, board] }));
      return board;
    } catch (error) {
      console.error("Failed to create board:", error);
      return null;
    }
  },

  setCurrentBoardId: (id) => {
    const { boards } = get();
    const currentBoard = boards.find((b) => b.id === id);
    const projectId = currentBoard?.projectId;
    set({
      currentBoardId: id,
      selectedStoryPageId: null,
      shots: [],
      keyframes: [],
    });
    if (id && projectId) {
      get().fetchStoryPagesByBoard(projectId, id);
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setStoryPages: (pages) => set({ storyPages: pages }),
  setShots: (shots) =>
    set((state) => ({
      shots: typeof shots === "function" ? shots(state.shots) : shots,
    })),
  setKeyframes: (keyframes) =>
    set((state) => ({
      keyframes:
        typeof keyframes === "function"
          ? keyframes(state.keyframes)
          : keyframes,
    })),

  updateKeyframe: (id, updates) =>
    set((state) => ({
      keyframes: state.keyframes.map((kf) =>
        kf.id === id ? { ...kf, ...updates } : kf,
      ),
    })),

  setSelectedStoryPageId: (id) => {
    set({ selectedStoryPageId: id, shots: [], keyframes: [] });
    if (id) {
      const projectId = get().projectId;
      if (projectId) {
        get().fetchShotsByStoryPage(projectId, id);
      }
    }
  },

  setActivePromptId: (id) => set({ activePromptId: id }),
  setActiveVideoPromptId: (id) => set({ activeVideoPromptId: id }),
  setShowShotNav: (show) => set({ showShotNav: show }),
  setShotNavPage: (page) =>
    set((state) => ({
      shotNavPage: typeof page === "function" ? page(state.shotNavPage) : page,
    })),
  toggleShotCollapsed: (shotId) =>
    set((state) => {
      const newSet = new Set(state.collapsedShotIds);
      if (newSet.has(shotId)) {
        newSet.delete(shotId);
      } else {
        newSet.add(shotId);
      }
      return { collapsedShotIds: newSet };
    }),
  setAllShotsCollapsed: (collapsed) =>
    set((state) => {
      if (collapsed) {
        const allIds = new Set(state.shots.map((s) => s.id));
        return { collapsedShotIds: allIds };
      } else {
        return { collapsedShotIds: new Set<string>() };
      }
    }),
  setEditingKeyframe: (kf) => set({ editingKeyframe: kf }),
  setEditingShot: (shot) => set({ editingShot: shot }),
  setInputMedia: (media) =>
    set((state) => ({
      inputMedia: typeof media === "function" ? media(state.inputMedia) : media,
    })),
  setSavedMedia: (media) =>
    set((state) => ({
      savedMedia: typeof media === "function" ? media(state.savedMedia) : media,
    })),

  openKeyframeEdit: (kf) => set({ editingKeyframeDraft: { ...kf } }),
  updateEditingKeyframeDraft: (updates) =>
    set((state) => ({
      editingKeyframeDraft: state.editingKeyframeDraft
        ? { ...state.editingKeyframeDraft, ...updates }
        : null,
    })),

  commitKeyframeEdit: () => {
    const { editingKeyframeDraft, editingKeyframe } = get();
    if (editingKeyframeDraft && editingKeyframe) {
      set((state) => ({
        keyframes: state.keyframes.map((kf) =>
          kf.id === editingKeyframe.id ? editingKeyframeDraft : kf,
        ),
        editingKeyframe: null,
        editingKeyframeDraft: null,
      }));
    }
  },

  cancelKeyframeEdit: () =>
    set({ editingKeyframe: null, editingKeyframeDraft: null }),

  fetchStoryPagesByBoard: async (projectId, boardId) => {
    try {
      const storyPages = await storyboardApi.getStoryPagesByBoard(
        projectId,
        boardId,
      );
      set({ storyPages });
    } catch (error) {
      console.error("Failed to fetch story pages:", error);
    }
  },

  createStoryPage: async (projectId, boardId, data) => {
    try {
      const storyPage = await storyboardApi.createStoryPage(
        projectId,
        boardId,
        data,
      );
      set((state) => ({ storyPages: [...state.storyPages, storyPage] }));
      return storyPage;
    } catch (error) {
      console.error("Failed to create story page:", error);
      return null;
    }
  },

  fetchShotsByStoryPage: async (projectId, storyPageId) => {
    set({ isShotsLoading: true });
    try {
      const shots = await storyboardApi.getShotsByStoryPage(
        projectId,
        storyPageId,
      );
      set({ shots, selectedShotIds: [] });
      for (const shot of shots) {
        get().fetchKeyframesByShot(shot.id);
      }
    } catch (error) {
      console.error("Failed to fetch shots:", error);
    } finally {
      set({ isShotsLoading: false });
    }
  },

  setIsShotsLoading: (loading) => set({ isShotsLoading: loading }),

  createShot: async (projectId, storyPageId, data) => {
    try {
      const shot = await storyboardApi.createShot(projectId, storyPageId, data);
      set((state) => ({ shots: [...state.shots, shot] }));
      return shot;
    } catch (error) {
      console.error("Failed to create shot:", error);
      return null;
    }
  },

  updateShot: async (shotId, data) => {
    try {
      const updated = await storyboardApi.updateShot(shotId, data);
      set((state) => ({
        shots: state.shots.map((s) => (s.id === shotId ? updated : s)),
      }));
      return updated;
    } catch (error) {
      console.error("Failed to update shot:", error);
      return null;
    }
  },

  deleteShot: async (shotId) => {
    try {
      await storyboardApi.deleteShot(shotId);
      set((state) => ({
        shots: state.shots.filter((s) => s.id !== shotId),
        keyframes: state.keyframes.filter((kf) => kf.shotId !== shotId),
        selectedShotIds: state.selectedShotIds.filter((id) => id !== shotId),
      }));
    } catch (error) {
      console.error("Failed to delete shot:", error);
    }
  },

  toggleShotSelection: (shotId) =>
    set((state) => ({
      selectedShotIds: state.selectedShotIds.includes(shotId)
        ? state.selectedShotIds.filter((id) => id !== shotId)
        : [...state.selectedShotIds, shotId],
    })),

  clearShotSelection: () => set({ selectedShotIds: [] }),

  deleteSelectedShotsAPI: async () => {
    const { selectedShotIds } = get();
    if (selectedShotIds.length === 0) return;
    try {
      await storyboardApi.deleteShotsBatch(selectedShotIds);
      set((state) => ({
        shots: state.shots.filter((s) => !selectedShotIds.includes(s.id)),
        keyframes: state.keyframes.filter(
          (kf) => !selectedShotIds.includes(kf.shotId),
        ),
        selectedShotIds: [],
      }));
    } catch (error) {
      console.error("Failed to batch delete shots:", error);
    }
  },

  fetchKeyframesByShot: async (shotId) => {
    try {
      const keyframes = await storyboardApi.getKeyframesByShot(shotId);
      set((state) => {
        const otherKeyframes = state.keyframes.filter(
          (kf) => kf.shotId !== shotId,
        );
        return { keyframes: [...otherKeyframes, ...keyframes] };
      });
    } catch (error) {
      console.error("Failed to fetch keyframes:", error);
    }
  },

  createKeyframe: async (shotId, data) => {
    try {
      const keyframe = await storyboardApi.createKeyframe(shotId, data);
      set((state) => ({ keyframes: [...state.keyframes, keyframe] }));
      return keyframe;
    } catch (error) {
      console.error("Failed to create keyframe:", error);
      return null;
    }
  },

  updateKeyframeAPI: async (keyframeId, data) => {
    try {
      const updated = await storyboardApi.updateKeyframe(keyframeId, data);
      set((state) => ({
        keyframes: state.keyframes.map((kf) =>
          kf.id === keyframeId ? updated : kf,
        ),
      }));
    } catch (error) {
      console.error("Failed to update keyframe:", error);
    }
  },

  deleteKeyframeAPI: async (keyframeId) => {
    try {
      await storyboardApi.deleteKeyframe(keyframeId);
      set((state) => ({
        keyframes: state.keyframes.filter((kf) => kf.id !== keyframeId),
      }));
    } catch (error) {
      console.error("Failed to delete keyframe:", error);
    }
  },

  batchUpdateKeyframesAPI: async (keyframes) => {
    try {
      await storyboardApi.batchUpdateKeyframes(keyframes);
    } catch (error) {
      console.error("Failed to batch update keyframes:", error);
    }
  },
  generateKeyframesAI: async (shotId: string) => {
    const { projectId } = get();
    if (!projectId) return null;
    try {
      const newKeyframes = await storyboardApi.generateKeyframesFromScript(shotId, {
        agentId: "",
        projectId,
        shotId,
      });
      set((state) => ({
        keyframes: [...state.keyframes, ...newKeyframes],
      }));
      return newKeyframes;
    } catch (error) {
      console.error("Failed to generate keyframes:", error);
      return null;
    }
  },
}));
