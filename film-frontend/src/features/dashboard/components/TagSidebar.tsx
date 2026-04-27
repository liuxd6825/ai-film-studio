import { Tag } from "../types";
import { Layers } from "lucide-react";

interface TagSidebarProps {
  tags: Tag[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  totalProjects: number;
}

export function TagSidebar({
  tags,
  selectedTag,
  onSelectTag,
  totalProjects,
}: TagSidebarProps) {
  return (
    <div className="w-44 bg-gray-50/80 dark:bg-gray-900/50 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
      <div className="p-4">
        <div
          className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
            selectedTag === null
              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          onClick={() => onSelectTag(null)}
        >
          <span className="font-medium text-sm">全部</span>
          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
            {totalProjects}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-1">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                selectedTag === tag.name
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => onSelectTag(tag.name)}
            >
              <span className="text-sm truncate">{tag.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedTag === tag.name
                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {tag.project_count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {tags.length === 0 && (
        <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
          <Layers size={24} className="mx-auto mb-2 opacity-50" />
          暂无标签
        </div>
      )}
    </div>
  );
}
