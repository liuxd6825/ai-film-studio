import { useRef, useEffect, useState } from "react";
import { Bubble } from "@ant-design/x";
import type { ChatMessage } from "@/stores/chatStore";
import { ChevronDown, ChevronRight } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
}

function ThinkingBlock({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>Thinking Process</span>
      </button>
      {isExpanded && (
        <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 italic whitespace-pre-wrap border-t border-gray-200 dark:border-gray-600">
          {content}
        </div>
      )}
    </div>
  );
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const items = messages.map((message) => {
    const role =
      message.role === "user"
        ? "user"
        : message.role === "system"
          ? "system"
          : "ai";

    let content: React.ReactNode = message.content;

    if (message.role === "assistant" && message.thinking) {
      content = (
        <>
          <ThinkingBlock content={message.thinking} />
          {(() => {
            let displayContent = message.content || "";
            let systemReminder = "";

            const reminderRegex =
              /<system-reminder>([\s\S]*?)(?:<\/system-reminder>|$)/;
            const match = displayContent.match(reminderRegex);
            if (match) {
              systemReminder = match[1].trim();
              displayContent = displayContent.replace(reminderRegex, "").trim();
            }

            return (
              <div className="flex flex-col gap-2">
                {message.thinking && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 p-2 rounded border border-gray-100 dark:border-gray-700 italic">
                    {message.thinking}
                  </div>
                )}
                {systemReminder && (
                  <div className="text-sm text-orange-600/80 dark:text-orange-400/80 bg-orange-50/50 dark:bg-orange-900/20 p-2 rounded border border-orange-100 dark:border-orange-900">
                    <strong>System Reminder:</strong>
                    <div className="whitespace-pre-wrap mt-1">
                      {systemReminder}
                    </div>
                  </div>
                )}
                {displayContent && (
                  <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{displayContent}</p>
                )}
              </div>
            );
          })()}
        </>
      );
    } else if (message.agentMentions && message.agentMentions.length > 0) {
      content = (
        <>
          <div className="text-xs opacity-75 mb-1">
            @{message.agentMentions.join(", @")}
          </div>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </>
      );
    }

    return {
      key: message.id,
      role,
      content,
    };
  });

  const roleConfig = {
    ai: {
      placement: "start" as const,
    },
    user: {
      placement: "end" as const,
    },
    system: {
      placement: "start" as const,
    },
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <Bubble.List items={items} role={roleConfig} />
      <div ref={bottomRef} />
    </div>
  );
}
