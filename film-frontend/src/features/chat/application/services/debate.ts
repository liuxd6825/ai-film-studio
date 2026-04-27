import { chatApi, type DebateRequest } from "@/api/chatClient";
import { useChatStore } from "@/stores/chatStore";

export interface DebateState {
  sessionId: string;
  topic: string;
  agentA: string;
  agentB: string;
  currentRound: number;
  maxRounds: number;
  status: "active" | "completed";
}

export async function startDebate(
  topic: string,
  agentA: string,
  agentB: string,
  rounds: number = 3,
): Promise<DebateState> {
  const currentSession = useChatStore.getState().currentSession;
  const mode = currentSession?.mode || "plan";

  const request: DebateRequest = {
    topic,
    agentA,
    agentB,
    rounds,
    mode,
  };

  const response = await chatApi.debate(request);

  return {
    sessionId: response.sessionId,
    topic,
    agentA,
    agentB,
    currentRound: 1,
    maxRounds: rounds,
    status: "active",
  };
}

export async function advanceDebateRound(
  debateState: DebateState,
): Promise<DebateState> {
  const nextRound = debateState.currentRound + 1;

  if (nextRound > debateState.maxRounds) {
    return { ...debateState, status: "completed" };
  }

  return {
    ...debateState,
    currentRound: nextRound,
  };
}
