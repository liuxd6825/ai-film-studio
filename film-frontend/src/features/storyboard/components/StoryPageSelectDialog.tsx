import { useState, useEffect, useCallback } from "react";
import { X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { seriesApi } from "../../series/api";
import { StoryPage } from "../types";
import { Button } from "./ui";

interface StoryPageSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (storyPage: StoryPage) => void;
  projectId: string;
}

function getStatusBadge(status: number) {
  switch (status) {
    case 2:
      return (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
          已完成
        </span>
      );
    case 1:
      return (
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
          进行中
        </span>
      );
    default:
      return (
        <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
          草稿
        </span>
      );
  }
}

export function StoryPageSelectDialog({
  isOpen,
  onClose,
  onSelect,
  projectId,
}: StoryPageSelectDialogProps) {
  const [allPages, setAllPages] = useState<StoryPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<StoryPage[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const pages = await seriesApi.getStoryPagesByProject(projectId);
      setAllPages(pages);
    } catch (error) {
      console.error("Failed to fetch story pages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      fetchPages();
    }
  }, [isOpen, fetchPages]);

  useEffect(() => {
    const filtered = search
      ? allPages.filter((p) =>
          p.title.toLowerCase().includes(search.toLowerCase()),
        )
      : allPages;
    setFilteredPages(filtered);
    setPage(1);
  }, [search, allPages]);

  const total = filteredPages.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPages = filteredPages.slice(startIndex, endIndex);

  const handleDoubleClick = (storyPage: StoryPage) => {
    onSelect(storyPage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium text-zinc-900">选择剧集</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="搜索剧集..."
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-zinc-400">加载中...</div>
          ) : currentPages.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">暂无剧集</div>
          ) : (
            <div className="space-y-2">
              {currentPages.map((storyPage) => (
                <div
                  key={storyPage.id}
                  onClick={() => handleDoubleClick(storyPage)}
                  onDoubleClick={() => handleDoubleClick(storyPage)}
                  className="p-3 rounded-lg border cursor-pointer hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {storyPage.title}
                    </span>
                    {getStatusBadge(storyPage.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-zinc-50">
          <span className="text-sm text-zinc-500">
            共 {total} 条，第 {page}/{totalPages || 1} 页
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
