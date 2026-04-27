import { ConfigProvider, theme } from "antd";
import { useChatStore } from "@/stores/chatStore";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { SessionList } from "./SessionList";
import { AlertCircle, X } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";

export function ChatContainer() {
  const currentSession = useChatStore((state) => state.currentSession);
  const error = useChatStore((state) => state.error);
  const clearError = useChatStore((state) => state.clearError);
  const { theme: themeMode } = useThemeStore();
  const isDark = themeMode === "dark";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1890ff",
        },
      }}
    >
      <div className="h-full flex bg-white dark:bg-gray-800">
        <SessionList />
        <div className="flex-1 flex flex-col">
          <div className="border-b px-4 py-2 flex items-center justify-between border-zinc-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">新建会话</h2>
          </div>
          {error && (
            <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-500 mt-0.5" size={18} />
              <div className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <MessageList messages={currentSession?.messages ?? []} />
          <MessageInput />
        </div>
      </div>
    </ConfigProvider>
  );
}
