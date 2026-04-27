import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  FileText,
  Image,
  Clapperboard,
  Layout,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { ModuleCard } from "./components/ModuleCard";
import { useProjectStore } from "@/stores/projectStore";

const modules = [
  {
    key: "chat",
    icon: MessageSquare,
    title: "会话",
    description: "AI 对话与协作",
    path: "chat",
  },
  {
    key: "document",
    icon: FileText,
    title: "文档",
    description: "Markdown 文档编写",
    path: "document",
  },
  {
    key: "assets",
    icon: Image,
    title: "资产",
    description: "图片与视频管理",
    path: "assets",
  },
  {
    key: "series",
    icon: Clapperboard,
    title: "剧集",
    description: "剧集与剧本管理",
    path: "series",
  },
  {
    key: "storyboard",
    icon: Layout,
    title: "故事板",
    description: "分镜与剧本创作",
    path: "storyboard",
  },
  {
    key: "canvas",
    icon: LayoutGrid,
    title: "画布",
    description: "视觉流程图与节点编辑",
    path: "canvases",
  },
  {
    key: "prompts",
    icon: Sparkles,
    title: "提示词",
    description: "提示词模板库",
    path: "prompts",
  },
];

export function ProjectHome() {
  const navigate = useNavigate();
  const currentProject = useProjectStore((s) => s.currentProject);

  return (
    <div className="h-full overflow-auto p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">功能模块</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <ModuleCard
              key={module.key}
              icon={module.icon}
              title={module.title}
              description={module.description}
              onClick={() => navigate(`/project/${currentProject?.id}/${module.path}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}