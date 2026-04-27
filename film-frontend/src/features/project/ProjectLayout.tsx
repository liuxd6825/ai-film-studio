import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { AntChatContainer } from "@/features/chat/components/ant-x/AntChatContainer";
import { FilePanel } from "@/features/document/FilePanel";
import { Canvas, useCanvasStore } from "@/features/canvas";
import { CanvasListPage } from "@/features/canvas/pages/CanvasListPage";
import { CanvasToolbar } from "@/features/canvas/ui/CanvasToolbar";
import { useChatStore } from "@/stores/chatStore";
import { useProjectStore } from "@/stores/projectStore";
import { useThemeStore } from "@/stores/themeStore";
import { AssetsModule } from "@/features/assets/AssetsModule";
import StoryboardModule from "@/features/storyboard/StoryboardModule";
import SeriesModule from "@/features/series/SeriesModule";
import { PromptPage } from "@/features/prompt/pages/PromptPage";
import { ProjectHome } from "./ProjectHome";

const views = [
  { key: "chat", label: "会话" },
  { key: "document", label: "文档" },
  { key: "assets", label: "资产" },
  { key: "series", label: "剧集" },
  { key: "storyboard", label: "故事板" },
  { key: "canvas", label: "画布" },
  { key: "canvases", label: "画布列表" },
  { key: "prompts", label: "提示词" },
] as const;

type ViewKey = (typeof views)[number]["key"];

export default function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const chatStoreSetProjectId = useChatStore((state) => state.setProjectId);
  const loadProject = useProjectStore((state) => state.loadProject);
  const currentProject = useProjectStore((state) => state.currentProject);
  const canvasName = useCanvasStore((state) => state.canvasName);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  useEffect(() => {
    if (projectId) {
      chatStoreSetProjectId(projectId);
      loadProject(projectId);
    }
    return () => {
      chatStoreSetProjectId("");
    };
  }, [projectId, chatStoreSetProjectId, loadProject]);

const currentPath = window.location.pathname;
  const getActiveView = (pathname: string): ViewKey | "home" => {
    if (pathname.match(/\/project\/[^/]+$/) || pathname.endsWith("/home")) return "home";
    if (pathname.includes("/canvas/")) return "canvas";
    return (pathname.split("/").pop() || "chat") as ViewKey;
  };
  const activeView = getActiveView(currentPath);
  const isSpecificCanvasPage = activeView === "canvas" && currentPath.includes("/canvas/");
  const isHomePage = activeView === "home";

  const handleNavigate = (view: ViewKey) => {
    if (projectId) {
      navigate(`/project/${projectId}/${view}`);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="h-12 border-b flex items-center px-4 bg-white dark:bg-gray-800 border-zinc-200 dark:border-gray-700">
        {isHomePage ? (
          <>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">返回主页</span>
            </button>
            <div className="flex-1" />
            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {currentProject?.name || "项目"}
            </h1>
            <div className="flex-1" />
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            >
              {theme === "dark" ? (
                <Sun size={18} className="text-gray-400" />
              ) : (
                <Moon size={18} className="text-gray-600" />
              )}
            </button>
          </>
        ) : isSpecificCanvasPage ? (
          <>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{canvasName || "画布"}</span>
            <div className="flex-1" />
            <CanvasToolbar />
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">返回主页</span>
            </button>
            <div className="flex-1" />
            <nav className="flex gap-2">
              {views.map((v) => (
                <button
                  key={v.key}
                  onClick={() => handleNavigate(v.key)}
                  className={`px-3 py-1 rounded transition-colors ${
                    activeView === v.key
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </nav>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2"
              title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            >
              {theme === "dark" ? (
                <Sun size={18} className="text-gray-400" />
              ) : (
                <Moon size={18} className="text-gray-600" />
              )}
            </button>
          </>
        )}
      </header>
      <main className={`flex-1 overflow-hidden relative dark:bg-gray-900 ${isHomePage ? "overflow-auto" : ""}`}>
        {projectId && (
          <>
            {isHomePage && <ProjectHome />}
            <div
              style={{
                display: activeView === "chat" ? "block" : "none",
                height: "100%",
              }}
            >
              <AntChatContainer />
            </div>
            <div
              style={{
                display: activeView === "document" ? "block" : "none",
                height: "100%",
              }}
            >
              <FilePanel projectId={projectId} />
            </div>
            <div
              style={{
                display: activeView === "assets" ? "block" : "none",
                height: "100%",
              }}
            >
              <AssetsModule />
            </div>
            <div
              style={{
                display: activeView === "storyboard" ? "block" : "none",
                height: "100%",
              }}
            >
              <StoryboardModule />
            </div>
            <div
              style={{
                display: activeView === "series" ? "block" : "none",
                height: "100%",
              }}
            >
              <SeriesModule />
            </div>
            <div
              style={{
                display: activeView === "canvas" ? "block" : "none",
                height: "100%",
              }}
            >
              <ReactFlowProvider>
                <Canvas />
              </ReactFlowProvider>
            </div>
            <div
              style={{
                display: activeView === "canvases" ? "block" : "none",
                height: "100%",
              }}
            >
              <CanvasListPage />
            </div>
            <div
              style={{
                display: activeView === "prompts" ? "block" : "none",
                height: "100%",
              }}
            >
              <PromptPage />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
