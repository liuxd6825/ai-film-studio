import { useState, useRef, useEffect } from "react";
import { Tag, Check, Plus, Search, X } from "lucide-react";

interface TagSelectorProps {
  projectId: string;
  currentTags: string[];
  allTags: string[];
  onToggle: (tagName: string, isAdding: boolean) => void;
  onCreateTag: (tagName: string) => void;
  onClose: () => void;
}

export function TagSelector({
  currentTags,
  allTags,
  onToggle,
  onCreateTag,
  onClose,
}: TagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (showCreateInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateInput]);

  const filteredTags = allTags.filter(
    (tag) =>
      !currentTags.includes(tag) &&
      tag.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateTag = () => {
    if (newTagName.trim() && !allTags.includes(newTagName.trim())) {
      onCreateTag(newTagName.trim());
      setNewTagName("");
      setShowCreateInput(false);
    }
  };

  return (
    <div
      ref={selectorRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-32"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索标签..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-200 dark:focus:border-blue-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto p-2">
          {currentTags.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">
                已添加
              </p>
              {currentTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onToggle(tag, false)}
                  className="w-full px-3 py-2 flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group"
                >
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-blue-500" />
                    <span>{tag}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-blue-500" />
                    <X
                      size={14}
                      className="text-gray-300 dark:text-gray-600 group-hover:text-red-400 transition-colors"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}

          {filteredTags.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">
                可添加
              </p>
              {filteredTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onToggle(tag, true)}
                  className="w-full px-3 py-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Tag size={14} className="text-gray-300 dark:text-gray-600" />
                  {tag}
                </button>
              ))}
            </div>
          )}

          {filteredTags.length === 0 && currentTags.length > 0 && (
            <p className="px-3 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">
              没有更多标签了
            </p>
          )}
        </div>

        <div className="p-2 border-t border-gray-100 dark:border-gray-700">
          {showCreateInput ? (
            <div className="p-2">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTag();
                    if (e.key === "Escape") {
                      setShowCreateInput(false);
                      setNewTagName("");
                    }
                  }}
                  placeholder="输入标签名称"
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-200 dark:focus:border-blue-800 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  创建
                </button>
                <button
                  onClick={() => {
                    setShowCreateInput(false);
                    setNewTagName("");
                  }}
                  className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateInput(true)}
              className="w-full px-3 py-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Plus size={16} />
              创建新标签
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
