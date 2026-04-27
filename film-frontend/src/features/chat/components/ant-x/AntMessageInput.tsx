import { useState, useEffect, useRef } from "react";
import {
  useChatStore,
  type ChatMode,
  type AgentMode,
} from "@/stores/chatStore";
import { Flex, Select } from "antd";
import {
  CommentOutlined,
  TeamOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { api } from "@/api/client";
import { FileText, X, FilePlus, Send } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";

interface FileItem {
  id: string;
  name: string;
}

export function AntMessageInput() {
  const [input, setInput] = useState("");
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [fileSearch, setFileSearch] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);
  const projectId = useChatStore((state) => state.projectId);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const currentSession = useChatStore((state) => state.currentSession);
  const setMode = useChatStore((state) => state.setMode);
  const setAgentMode = useChatStore((state) => state.setAgentMode);
  const isLoading = useChatStore((state) => state.isLoading);
  const agents = useChatStore((state) => state.agents);
  const selectedAgentId = useChatStore((state) => state.selectedAgentId);
  const loadAgents = useChatStore((state) => state.loadAgents);
  const setSelectedAgent = useChatStore((state) => state.setSelectedAgent);
  const { theme: themeMode } = useThemeStore();
  const isDark = themeMode === "dark";

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isLoading) return;
    setInput("");
    const filesToSend = selectedFiles.length > 0 ? selectedFiles : undefined;
    setSelectedFiles([]);
    await sendMessage(value, undefined, undefined, filesToSend);
  };

  useEffect(() => {
    if (showFilePicker && projectId) {
      api
        .get<FileItem[]>(`/api/v1/projects/${projectId}/files`)
        .then(setFiles)
        .catch(console.error);
    }
  }, [showFilePicker, projectId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowFilePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFile = (file: FileItem) => {
    const exists = selectedFiles.find((f) => f.id === file.id);
    if (exists) {
      setSelectedFiles(selectedFiles.filter((f) => f.id !== file.id));
    } else {
      setSelectedFiles([...selectedFiles, { id: file.id, name: file.name }]);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(selectedFiles.filter((f) => f.id !== id));
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(fileSearch.toLowerCase()),
  );

  return (
    <div className="p-4 border-t bg-white dark:bg-gray-800 border-zinc-200 dark:border-gray-700">
      <div className="border rounded-lg p-3 border-zinc-200 dark:border-gray-700 bg-zinc-50 dark:bg-gray-900">
        {selectedFiles.length > 0 && (
          <Flex gap={8} align="center" className="mb-2 flex-wrap">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
              >
                <FileText size={12} />
                <span>{file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </Flex>
        )}

        <Flex align="center" gap={8} className="mb-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(input);
              }
            }}
            placeholder={
              isLoading ? "Waiting for response..." : "Type a message..."
            }
            disabled={isLoading}
            rows={2}
            className={`flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm resize-none bg-transparent ${isDark ? "text-gray-100 placeholder:text-gray-500" : "text-gray-900"}`}
          />
        </Flex>

        <Flex gap={8} align="center" wrap="wrap">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilePicker(!showFilePicker)}
              className={`p-2 rounded-lg transition-colors ${showFilePicker ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
              title="添加文件"
            >
              <FilePlus size={18} />
            </button>
            {showFilePicker && (
              <div
                ref={pickerRef}
                className="absolute bottom-full left-0 mb-2 w-72 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50"
              >
                <div className="p-2 border-b bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    placeholder="搜索文件..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                {filteredFiles.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
                    暂无文件
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredFiles.map((file) => {
                      const isSelected = selectedFiles.some(
                        (f) => f.id === file.id,
                      );
                      return (
                        <button
                          key={file.id}
                          onClick={() => toggleFile(file)}
                          className={`w-full px-3 py-2 flex items-center gap-2 text-left text-sm ${isSelected ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                        >
                          <FileText
                            size={14}
                            className={
                              isSelected ? "text-blue-500" : "text-gray-400"
                            }
                          />
                          <span className="truncate flex-1">{file.name}</span>
                          {isSelected && (
                            <span className="text-blue-500">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {currentSession && (
            <>
              <Select<string>
                variant="borderless"
                value={selectedAgentId || "default"}
                onChange={(value) =>
                  setSelectedAgent(value === "default" ? "" : value)
                }
                disabled={isLoading}
                size="small"
                showSearch
                optionFilterProp="label"
                placeholder="选择 Agent"
                options={[
                  { value: "default", label: "默认模式" },
                  ...agents.map((agent) => ({
                    value: agent.id,
                    label: agent.name,
                  })),
                ]}
                suffixIcon={<RobotOutlined />}
                className={isDark ? "dark" : ""}
              />
              <Select<AgentMode>
                variant="borderless"
                value={currentSession.agentMode}
                onChange={(value) => setAgentMode(value)}
                disabled={isLoading}
                size="small"
                options={[
                  { value: "orchestrator", label: "🤖 编排" },
                  {
                    value: "debate",
                    label: "⚔️ 争论",
                    icon: <TeamOutlined />,
                  },
                ]}
                className={isDark ? "dark" : ""}
              />
              <Select<ChatMode>
                variant="borderless"
                value={currentSession.mode}
                onChange={(value) => setMode(value)}
                disabled={isLoading}
                size="small"
                options={[
                  {
                    value: "plan",
                    label: "计划模式",
                    icon: <CommentOutlined />,
                  },
                  { value: "build", label: "工作模式" },
                ]}
                className={isDark ? "dark" : ""}
              />
            </>
          )}

          <button
            type="button"
            onClick={() => handleSubmit(input)}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-auto"
          >
            <Send size={18} />
          </button>
        </Flex>
      </div>
    </div>
  );
}
