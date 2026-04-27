import { api } from "./client";
import type { ChatMode } from "@/stores/chatStore";

export interface OrchestrateRequest {
  message: string;
  projectId: string;
  agents: string[];
  skills: string[];
  mode: ChatMode;
}

export interface DebateRequest {
  topic: string;
  agentA: string;
  agentB: string;
  rounds: number;
  mode: ChatMode;
}

export interface FileReadRequest {
  path: string;
}

export interface FileWriteRequest {
  path: string;
  content: string;
}

export interface ChatResponse {
  sessionId: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    agentMentions?: string[];
  }>;
}

export interface SessionResponse {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  model: string;
  instructions: string;
  skills: string[];
}

export const chatApi = {
  getConversations: (agentId: string) =>
    api.get<{ id: string; title: string }[]>(
      `/api/v1/agents/${agentId}/conversations`,
    ),

  getAgents: () => api.get<AgentConfig[]>("/api/v1/agents"),

  createSession: (
    projectId: string,
    title?: string,
    agentId?: string,
    agentName?: string,
  ) =>
    api.post<SessionResponse>("/api/v1/chat/sessions", {
      projectId,
      title,
      agentId,
      agentName,
    }),

  getSessions: (projectId: string) =>
    api.get<SessionResponse[]>(`/api/v1/chat/sessions?projectId=${projectId}`),

  deleteSession: (id: string) => api.delete(`/api/v1/chat/sessions/${id}`),

  getMessages: (conversationId: string) =>
    api.get<
      Array<{ id: string; role: string; content: string; timestamp: number }>
    >(`/api/v1/conversations/${conversationId}/messages`),

  orchestrate: (req: OrchestrateRequest) =>
    api.post<ChatResponse>("/api/v1/chat/orchestrate", req),

  debate: (req: DebateRequest) =>
    api.post<ChatResponse>("/api/v1/chat/debate", req),

  plan: (message: string, projectId: string) =>
    api.post<ChatResponse>("/api/v1/chat/plan", { message, projectId }),

  build: (message: string, projectId: string) =>
    api.post<ChatResponse>("/api/v1/chat/build", { message, projectId }),

  streamPlan: async function* (
    message: string,
    projectId: string,
    sessionId: string,
    signal?: AbortSignal,
    files?: { id: string; name: string }[],
  ) {
    const response = await fetch(`/api/v1/chat/stream-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, projectId, sessionId, files }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      let chunk = decoder.decode(value, { stream: true });

      if (chunk.trim().startsWith('{"error":')) {
        try {
          const err = JSON.parse(chunk.trim());
          if (err.error) throw new Error(err.error);
        } catch (e) {
          // ignore parsing errors
        }
      }

      yield chunk;
    }
  },

  streamAgent: async function* (
    message: string,
    projectId: string,
    sessionId: string,
    agentId: string,
    signal?: AbortSignal,
    files?: { id: string; name: string }[],
  ) {
    const response = await fetch(`/api/v1/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, projectId, sessionId, agentId, files }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      let chunk = decoder.decode(value, { stream: true });

      if (chunk.trim().startsWith('{"error":')) {
        try {
          const err = JSON.parse(chunk.trim());
          if (err.error) throw new Error(err.error);
        } catch (e) {
          // ignore parsing errors
        }
      }

      yield chunk;
    }
  },
};

export const fileApi = {
  read: (path: string) =>
    api.post<{ content: string }>("/api/v1/files/read", { path }),

  write: (path: string, content: string) =>
    api.post<void>("/api/v1/files/write", { path, content }),

  preview: (path: string, content: string) =>
    api.post<{ preview: unknown }>("/api/v1/files/preview", { path, content }),
};
