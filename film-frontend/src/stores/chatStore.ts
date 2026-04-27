import { create } from "zustand";
import { chatApi, type AgentConfig } from "@/api/chatClient";

export type ChatMode = "plan" | "build";
export type AgentMode = "orchestrator" | "debate";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string;
  agentMentions?: string[];
  skillInvocations?: string[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  mode: ChatMode;
  agentMode: AgentMode;
  messages: ChatMessage[];
}

interface ChatState {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  projectId: string | null;
  isLoading: boolean;
  error: string | null;
  abortController: AbortController | null;
  agents: AgentConfig[];
  selectedAgentId: string;
  selectedAgentName: string;

  createSession: (
    mode: ChatMode,
    agentMode: AgentMode,
    projectId?: string,
  ) => Promise<string>;
  setProjectId: (projectId: string) => void;
  loadSessions: (projectId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  loadAgents: () => Promise<void>;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => Promise<void>;
  sendMessage: (
    content: string,
    projectId: string | undefined,
    sessionId?: string,
    files?: { id: string; name: string }[],
  ) => Promise<void>;
  cancelGeneration: () => void;
  setMode: (mode: ChatMode) => void;
  setAgentMode: (agentMode: AgentMode) => void;
  setSelectedAgent: (agentName: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentSession: null,
  sessions: [],
  projectId: null,
  isLoading: false,
  error: null,
  abortController: null,
  agents: [],
  selectedAgentId: "",
  selectedAgentName: "",

  setProjectId: (projectId) => {
    set({ projectId });
    if (projectId) {
      get().loadSessions(projectId);
    }
  },

  loadAgents: async () => {
    try {
      const agents = await chatApi.getAgents();
      set({ agents });
    } catch (error) {
      console.error("Failed to load agents:", error);
    }
  },

  loadSessions: async (projectId) => {
    set({ isLoading: true });
    try {
      const sessionsData = await chatApi.getSessions(projectId);
      const sessions: ChatSession[] = sessionsData.map((s) => ({
        id: s.id,
        mode: "plan",
        agentMode: "orchestrator",
        messages: [],
      }));
      set({ sessions, isLoading: false });
      if (sessions.length > 0) {
        get().switchSession(sessions[0].id);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadMessages: async (conversationId) => {
    set({ isLoading: true });
    try {
      const backendMessages = await chatApi.getMessages(conversationId);
      const messages: ChatMessage[] = backendMessages.map((m: any) => ({
        id: m.ID,
        role: m.Role.toLowerCase() as "user" | "assistant" | "system",
        content: m.Content,
        thinking: m.Thinking || "",
        timestamp: m.CreatedAt || Date.now(),
      }));
      set((state) => ({
        currentSession: state.sessions.find((s) => s.id === conversationId)
          ? {
              ...state.sessions.find((s) => s.id === conversationId)!,
              messages,
            }
          : null,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  cancelGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null, isLoading: false });
    }
  },

  createSession: async (mode, agentMode, projectId?: string) => {
    if (!projectId) {
      projectId = get().projectId || undefined;
    }
    if (!projectId) {
      throw new Error("projectId is required");
    }

    const res = await chatApi.createSession(
      projectId,
      "New Chat",
      get().selectedAgentId,
      get().selectedAgentName,
    );
    const session: ChatSession = {
      id: res.id,
      mode,
      agentMode,
      messages: [],
    };
    set((state) => ({
      sessions: [...state.sessions, session],
      currentSession: session,
      projectId: projectId || state.projectId,
    }));
    return res.id;
  },

  switchSession: (id: string) => {
    const { sessions, loadMessages } = get();
    const session = sessions.find((s) => s.id === id);
    if (session) {
      set({ currentSession: session, error: null });
      loadMessages(id);
    }
  },

  deleteSession: async (id) => {
    try {
      await chatApi.deleteSession(id);
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
    const { sessions, currentSession } = get();
    const newSessions = sessions.filter((s) => s.id !== id);
    let newCurrent = currentSession;
    if (currentSession?.id === id) {
      newCurrent =
        newSessions.length > 0 ? newSessions[newSessions.length - 1] : null;
    }
    set({ sessions: newSessions, currentSession: newCurrent });
  },

  sendMessage: async (content, projectId, sessionId, files) => {
    const {
      currentSession,
      addMessage,
      updateMessage,
      projectId: storeProjectId,
      selectedAgentId,
      createSession,
    } = get();

    let actualSessionId = sessionId || currentSession?.id;
    const actualProjectId = projectId || storeProjectId || "";

    if (!actualSessionId) {
      actualSessionId = await createSession(
        "plan",
        "orchestrator",
        actualProjectId,
      );
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    addMessage(userMessage);

    set({ isLoading: true, error: null });

    const assistantMsgId = `msg-${Date.now() + 1}`;
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    addMessage(assistantMessage);

    const abortController = new AbortController();
    set({ abortController });

    let rawContent = "";

    try {
      const streamIterator = chatApi.streamAgent(
        content,
        actualProjectId,
        actualSessionId!,
        selectedAgentId,
        abortController.signal,
        files,
      );

      for await (const chunk of streamIterator) {
        rawContent += chunk.toString();
        debugger;
        let parsedContent = "";
        let parsedThinking = "";

        const regex = /<think>([\s\S]*?)(?:<\/think>|$)/g;
        let match;
        let lastIndex = 0;

        while ((match = regex.exec(rawContent)) !== null) {
          parsedContent += rawContent.substring(lastIndex, match.index);

          if (parsedThinking && match[1]) {
            parsedThinking += "\n\n";
          }

          parsedThinking += match[1];
          lastIndex = regex.lastIndex;
        }

        parsedContent += rawContent.substring(lastIndex);

        updateMessage(assistantMsgId, {
          content: parsedContent,
          thinking: parsedThinking || undefined,
        });
      }
    } catch (error) {
      // Re-parse current rawContent to ensure we have the latest state on error
      let parsedContent = "";
      let parsedThinking = "";

      const regex = /<think>([\s\S]*?)(?:<\/think>|$)/g;
      let match;
      let lastIndex = 0;

      while ((match = regex.exec(rawContent)) !== null) {
        parsedContent += rawContent.substring(lastIndex, match.index);

        if (parsedThinking && match[1]) {
          parsedThinking += "\n\n";
        }

        parsedThinking += match[1];
        lastIndex = regex.lastIndex;
      }

      parsedContent += rawContent.substring(lastIndex);

      if (error instanceof Error && error.name === "AbortError") {
        updateMessage(assistantMsgId, {
          content: parsedContent || "(Generation cancelled)",
          thinking: parsedThinking || undefined,
        });
      } else {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to get response";
        set({ error: errorMessage });
        updateMessage(assistantMsgId, {
          content: parsedContent
            ? `${parsedContent}\n\nError: ${errorMessage}`
            : `Error: ${errorMessage}`,
          thinking: parsedThinking || undefined,
        });
      }
    } finally {
      set({ isLoading: false, abortController: null });
    }
  },

  setMode: (mode) => {
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, mode }
        : null,
    }));
  },

  setAgentMode: (agentMode) => {
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, agentMode }
        : null,
    }));
  },

  setSelectedAgent: (agentId: string) => {
    const agent = get().agents.find((a) => a.id === agentId);
    const agentName = agent?.name || "";
    set({ selectedAgentId: agentId, selectedAgentName: agentName });
  },

  addMessage: (message) => {
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            messages: [...state.currentSession.messages, message],
          }
        : null,
    }));
  },

  updateMessage: (id, updates) => {
    set((state) => {
      if (!state.currentSession) return state;
      const messages = state.currentSession.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg,
      );
      return {
        currentSession: { ...state.currentSession, messages },
      };
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
