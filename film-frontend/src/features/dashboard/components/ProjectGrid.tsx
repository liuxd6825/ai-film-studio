import { Project } from "../types";
import { ProjectCard } from "./ProjectCard";
import { FolderOpen } from "lucide-react";

interface ProjectGridProps {
  projects: Project[];
  deleteMode: boolean;
  selectedProjects: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectProject: (id: string) => void;
  onTagClick: (projectId: string) => void;
  onSettingsClick: (projectId: string) => void;
}

export function ProjectGrid({
  projects,
  deleteMode,
  selectedProjects,
  onToggleSelect,
  onSelectProject,
  onTagClick,
  onSettingsClick,
}: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <FolderOpen size={32} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-1">暂无项目</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">点击上方「新建项目」开始创作</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          deleteMode={deleteMode}
          isSelected={selectedProjects.has(project.id)}
          onToggleSelect={() => onToggleSelect(project.id)}
          onSelect={() => onSelectProject(project.id)}
          onTagClick={() => onTagClick(project.id)}
          onSettingsClick={() => onSettingsClick(project.id)}
        />
      ))}
    </div>
  );
}
