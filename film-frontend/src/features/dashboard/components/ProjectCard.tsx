import { useState } from "react";
import { Project, PROJECT_STATUS } from "../types";
import { FolderOpen, Check, Tag, Settings, Clock, Film } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  deleteMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSelect: () => void;
  onTagClick: () => void;
  onSettingsClick: () => void;
}

export function ProjectCard({
  project,
  deleteMode,
  isSelected,
  onToggleSelect,
  onSelect,
  onTagClick,
  onSettingsClick,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusInfo =
    PROJECT_STATUS.find((s) => s.value === project.status) || PROJECT_STATUS[0];
  const statusColorMap: Record<string, string> = {
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 cursor-pointer group ${
        isHovered && !deleteMode
          ? "shadow-lg -translate-y-0.5 border-blue-100 dark:border-blue-900"
          : "shadow-sm border-gray-100 dark:border-gray-700"
      } ${isSelected ? "ring-2 ring-red-400 border-transparent" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {deleteMode && (
        <div
          className="absolute top-3 left-3 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? "bg-red-500 border-red-500 text-white"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500"
            }`}
          >
            {isSelected && <Check size={12} />}
          </div>
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onSettingsClick();
        }}
        className={`absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-all ${
          isHovered && !deleteMode
            ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 opacity-100"
            : "opacity-0"
        }`}
      >
        <Settings size={16} />
      </button>

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isHovered && !deleteMode
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500"
                : "bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
            } transition-colors`}
          >
            <FolderOpen size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight truncate">
                {project.name}
              </h3>
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${statusColorMap[statusInfo.color]}`}
              >
                {statusInfo.label}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mb-3">
          {project.duration && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              {project.duration}
            </div>
          )}
          {project.style && (
            <div className="flex items-center gap-1">
              <Film size={12} />
              {project.style}
            </div>
          )}
        </div>

        {(project.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <Tag size={10} />
                {tag}
              </button>
            ))}
            {(project.tags || []).length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {(!project.tags || project.tags.length === 0) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTagClick();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Tag size={10} />
            添加标签
          </button>
        )}
      </div>
    </div>
  );
}
