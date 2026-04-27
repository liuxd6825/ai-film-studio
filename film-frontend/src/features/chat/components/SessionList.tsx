import { memo } from "react";
import { useChatStore } from "@/stores/chatStore";
import { X } from "lucide-react";

export const SessionList = memo(function SessionList() {
  const sessions = useChatStore((state) => state.sessions);
  const currentSession = useChatStore((state) => state.currentSession);
  const switchSession = useChatStore((state) => state.switchSession);
  const deleteSession = useChatStore((state) => state.deleteSession);
  const createSession = useChatStore((state) => state.createSession);

  const getPreview = (content: string) => {
    return content.length > 30 ? content.slice(0, 30) + "..." : content;
  };

  return (
    <div className="w-64 h-full border-r flex flex-col bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <button
          onClick={() =>
            createSession("plan", "orchestrator").catch(console.error)
          }
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
        >
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {sessions.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
            No sessions yet
          </div>
        ) : (
          <div className="py-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => switchSession(session.id)}
                className={`group relative mx-2 my-1 px-3 py-2 rounded cursor-pointer text-sm ${
                  currentSession?.id === session.id
                    ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {session.mode === "plan" ? "Plan" : "Build"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  >
                    <X size={14} className="text-red-500" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {session.agentMode === "orchestrator"
                    ? "🤖 Orch"
                    : "⚔️ Debate"}
                </div>
                {session.messages.length > 0 && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                    {getPreview(session.messages[0].content)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
