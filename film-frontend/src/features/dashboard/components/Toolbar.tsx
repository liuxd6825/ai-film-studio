import { useState, useRef, useEffect } from "react";
import { SortState, SortOption } from "../types";
import { Search, Plus, Trash2, ChevronDown, ArrowUpDown } from "lucide-react";

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateProject: (name: string, description: string) => void;
  deleteMode: boolean;
  onToggleDeleteMode: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  sortState: SortState;
  onSortChange: (state: SortState) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "updated_at", label: "最近更新" },
  { value: "created_at", label: "创建时间" },
  { value: "name", label: "名称" },
  { value: "tag_count", label: "标签数量" },
];

export function Toolbar({
  searchQuery,
  onSearchChange,
  onCreateProject,
  deleteMode,
  onToggleDeleteMode,
  selectedCount,
  onDeleteSelected,
  sortState,
  onSortChange,
}: ToolbarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreate = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), newProjectDesc.trim());
      setNewProjectName("");
      setNewProjectDesc("");
      setShowCreateModal(false);
    }
  };

  const handleSortSelect = (field: SortOption) => {
    if (sortState.field === field) {
      onSortChange({
        ...sortState,
        direction: sortState.direction === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({ field, direction: "desc" });
    }
    setShowSortDropdown(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索项目..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-200 dark:focus:border-blue-800 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
        >
          <Plus size={18} />
          新建项目
        </button>

        {deleteMode ? (
          <>
            <button
              onClick={onToggleDeleteMode}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              取消
            </button>
            <button
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              删除 ({selectedCount})
            </button>
          </>
        ) : (
          <button
            onClick={onToggleDeleteMode}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            <Trash2 size={16} />
          </button>
        )}

        <div ref={sortRef} className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            <ArrowUpDown size={16} />
            <span className="hidden sm:inline">
              {sortOptions.find((o) => o.value === sortState.field)?.label}
            </span>
            <ChevronDown size={14} />
          </button>

          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortSelect(option.value)}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    sortState.field === option.value
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {option.label}
                  {sortState.field === option.value && (
                    <span className="text-xs">
                      {sortState.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 m-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">新建项目</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  项目名称
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="输入项目名称"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-200 dark:focus:border-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  项目描述
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="输入项目描述（可选）"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-200 dark:focus:border-blue-800 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectName("");
                  setNewProjectDesc("");
                }}
                className="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newProjectName.trim()}
                className="px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
