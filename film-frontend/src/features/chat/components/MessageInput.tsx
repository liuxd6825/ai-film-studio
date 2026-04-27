import { useState } from "react";
import { Sender } from "@ant-design/x";
import { useChatStore } from "@/stores/chatStore";

export function MessageInput() {
  const [input, setInput] = useState("");
  const sendMessage = useChatStore((state) => state.sendMessage);
  const currentSession = useChatStore((state) => state.currentSession);
  const isLoading = useChatStore((state) => state.isLoading);
  const cancelGeneration = useChatStore((state) => state.cancelGeneration);

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isLoading) return;
    setInput("");
    await sendMessage(value, "");
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
      <Sender
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        loading={isLoading}
        onCancel={cancelGeneration}
        placeholder={
          isLoading ? "Waiting for response..." : "Type a message..."
        }
      />
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Tip: @agentname to mention agent, /skillname to invoke skill
        </span>
        {currentSession && (
          <div className="flex items-center gap-3">
            <span className="text-xs">Mode: {currentSession.mode}</span>
            <span className="text-xs">Agent: {currentSession.agentMode}</span>
          </div>
        )}
      </div>
    </div>
  );
}
