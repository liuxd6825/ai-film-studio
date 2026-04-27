import {
  useChatStore,
  type ChatMode,
  type AgentMode,
} from "@/stores/chatStore";

export function ModeToggle() {
  const currentSession = useChatStore((state) => state.currentSession);
  const setMode = useChatStore((state) => state.setMode);
  const setAgentMode = useChatStore((state) => state.setAgentMode);

  if (!currentSession) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Mode:</span>
        <select
          value={currentSession.mode}
          onChange={(e) => setMode(e.target.value as ChatMode)}
          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="plan">设计</option>
          <option value="build">工作</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Agent:</span>
        <select
          value={currentSession.agentMode}
          onChange={(e) => setAgentMode(e.target.value as AgentMode)}
          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="orchestrator">编排</option>
          <option value="debate">争论</option>
        </select>
      </div>
    </div>
  );
}
