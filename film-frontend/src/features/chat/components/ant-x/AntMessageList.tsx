import { useRef, useEffect } from "react";
import type { ChatMessage } from "@/stores/chatStore";
import { Bubble, Think } from "@ant-design/x";
import { Flex } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useThemeStore } from "@/stores/themeStore";

interface MessageListProps {
  messages: ChatMessage[];
}

export function AntMessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { theme: themeMode } = useThemeStore();
  const isDark = themeMode === "dark";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const items = messages.flatMap((message) => {
    const isAssistant = message.role === "assistant";
    const isSystem = message.role === "system";

    if (isAssistant) {
      let displayContent = message.content || "";
      let systemReminder = "";

      const reminderRegex =
        /<system-reminder>([\s\S]*?)(?:<\/system-reminder>|$)/;
      const match = displayContent.match(reminderRegex);
      if (match) {
        systemReminder = match[1].trim();
        displayContent = displayContent.replace(reminderRegex, "").trim();
      }

      const result = [];

      // 1. Thinking Bubble
      if (message.thinking) {
        result.push({
          key: `${message.id}-thinking`,
          role: "assistant-thinking",
          content: message,
        } as const);
      }

      // 2. System Reminder Bubble
      if (systemReminder) {
        result.push({
          key: `${message.id}-system-reminder`,
          role: "assistant-system-reminder",
          content: { ...message, systemReminderText: systemReminder },
        } as const);
      }

      // 3. Main Content Bubble
      const hasContent = displayContent.length > 0;
      const isLoading = !message.content && !message.thinking;

      // Always show content bubble if there's text, or if it's currently loading, or if no other parts exist
      if (hasContent || isLoading || result.length === 0) {
        result.push({
          key: `${message.id}-content`,
          role: "assistant",
          content: { ...message, displayContent },
          loading: isLoading,
        } as const);
      }

      return result;
    }

    return [
      {
        key: message.id,
        role: message.role,
        content: message,
        styles: isSystem
          ? {
              bubble: {
                backgroundColor: isDark ? "#2d2518" : "#fffbe6",
                border: isDark ? "1px solid #5a4d32" : "1px solid #ffe58f",
                color: isDark ? "#f0d788" : undefined,
              },
            }
          : undefined,
        loading: false,
      } as any,
    ];
  });

  const roles = {
    "assistant-thinking": {
      placement: "start" as const,
      contentRender: (message: any) => (
        <Think title="Reasoning Process" className="w-full" defaultExpanded>
          {message.thinking}
        </Think>
      ),
    },
    "assistant-system-reminder": {
      placement: "start" as const,
      contentRender: (message: any) => (
        <Think title="System Reminder" className="w-full" defaultExpanded>
          <div className={`whitespace-pre-wrap text-sm ${isDark ? "text-orange-300" : "text-gray-600"}`}>
            {message.systemReminderText}
          </div>
        </Think>
      ),
    },
    assistant: {
      placement: "start" as const,
      typing: { step: 2, interval: 20 },
      contentRender: (message: any) => {
        const text = message.displayContent ?? message.content ?? "";
        return (
          <div className={`prose prose-sm max-w-none ${isDark ? "prose-invert" : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        );
      },
    },
    user: {
      placement: "end" as const,
      contentRender: (message: any) => {
        const mentionsDisplay =
          message.agentMentions && message.agentMentions.length > 0 ? (
            <div className={`text-xs text-blue-500 mb-1 opacity-80 ${isDark ? "text-blue-400" : ""}`}>
              @{message.agentMentions.join(", @")}
            </div>
          ) : null;
        return (
          <Flex vertical gap="small">
            {mentionsDisplay}
            <div className={`whitespace-pre-wrap ${isDark ? "text-gray-100" : ""}`}>{message.content}</div>
          </Flex>
        );
      },
    },
    system: {
      placement: "start" as const,
      variant: "filled" as const,
      contentRender: (message: any) => (
        <div className={`whitespace-pre-wrap ${isDark ? "text-gray-100" : ""}`}>{message.content}</div>
      ),
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <Bubble.List items={items as any} role={roles as any} />
      <div ref={bottomRef} />
    </div>
  );
}
