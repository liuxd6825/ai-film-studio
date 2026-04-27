import { useChatStore } from "@/stores/chatStore";
import { AlertCircle, X } from "lucide-react";
import { AntMessageList } from "./AntMessageList";
import { AntMessageInput } from "./AntMessageInput";
import { SessionList } from "../SessionList";
import { Flex, Layout, ConfigProvider, theme } from "antd";
import { useThemeStore } from "@/stores/themeStore";

const { Sider, Content } = Layout;

export function AntChatContainer() {
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
      <Layout className="h-full bg-white dark:bg-gray-800">
        <Sider width={250} className="border-r border-zinc-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <SessionList />
        </Sider>
        <Content className="flex flex-col h-full bg-white dark:bg-gray-800 relative">
          <div className="border-b px-4 py-3 flex items-center justify-between bg-white dark:bg-gray-800 border-zinc-200 dark:border-gray-700 z-10">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">会话标题</h2>
          </div>

          {error && (
            <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 z-10 relative">
              <AlertCircle className="text-red-500 mt-0.5" size={18} />
              <div className="flex-1 text-sm text-red-700 dark:text-red-300">{error}</div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <Flex
            vertical
            className="flex-1 overflow-hidden relative"
            style={{ height: "calc(100% - 53px)" }}
          >
            <div
              className="flex-1 overflow-y-auto px-4 py-4 bg-white dark:bg-gray-800"
              style={{ paddingBottom: "20px" }}
            >
              <AntMessageList messages={currentSession?.messages ?? []} />
            </div>
            <div className="bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm z-20 border-t border-zinc-200 dark:border-gray-700">
              <AntMessageInput />
            </div>
          </Flex>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
