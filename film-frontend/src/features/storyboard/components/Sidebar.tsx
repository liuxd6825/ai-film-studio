import { useState } from "react";
import { Clapperboard, FileText, Plus } from "lucide-react";
import { useStoryboardStore } from "../store";
import { Badge } from "./ui";
import { StoryPageCreateDialog } from "./StoryPageCreateDialog";
import { BoardCreateDialog } from "./BoardCreateDialog";

export function Sidebar() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBoardCreateDialog, setShowBoardCreateDialog] = useState(false);
  const {
    boards,
    currentBoardId,
    setCurrentBoardId,
    storyPages,
    selectedStoryPageId,
    setSelectedStoryPageId,
    setShotNavPage,
  } = useStoryboardStore();

  const boardStoryPages = storyPages
    .filter((sp) => sp.boardId === currentBoardId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const handleNavigate = (pageId: string) => {
    if (selectedStoryPageId !== pageId) {
      setSelectedStoryPageId(pageId);
      setShotNavPage(0);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 2:
        return (
          <Badge
            variant="default"
            className="text-[10px] h-4 px-1 font-normal shrink-0 ml-2"
          >
            已完成
          </Badge>
        );
      case 1:
        return (
          <Badge
            variant="secondary"
            className="text-[10px] h-4 px-1 font-normal shrink-0 ml-2"
          >
            进行中
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] h-4 px-1 font-normal shrink-0 ml-2"
          >
            草稿
          </Badge>
        );
    }
  };

  return (
    <div className="w-60 border-r bg-white dark:bg-zinc-900 flex flex-col h-full shrink-0 dark:border-zinc-700">
      <div className="p-3 border-b flex items-center gap-2 dark:border-zinc-700">
        <div className="bg-zinc-900 dark:bg-zinc-700 text-white p-1 rounded-md">
          <Clapperboard size={16} />
        </div>
        <h1 className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-100">分镜看板</h1>
      </div>

      <div className="p-3 border-b dark:border-zinc-700">
        {boards.length === 0 ? (
          <button
            onClick={() => setShowBoardCreateDialog(true)}
            className="w-full px-2 py-1.5 text-sm border border-dashed rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 dark:hover:border-zinc-500 dark:hover:text-zinc-300 transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={14} />
            <span>创建看板</span>
          </button>
        ) : (
          <select
            className="w-full px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
            value={currentBoardId || ""}
            onChange={(e) => {
              setCurrentBoardId(e.target.value);
              const firstPage = storyPages.find(
                (sp) => sp.boardId === e.target.value,
              );
              setSelectedStoryPageId(firstPage?.id || null);
            }}
          >
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-3">
          {boardStoryPages.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 text-xs">
              <p>暂无故事页</p>
              <p className="mt-1 text-[10px] opacity-60">点击下方按钮创建</p>
            </div>
          ) : (
            <div className="space-y-1">
              {boardStoryPages.map((page) => {
                const isSelected = selectedStoryPageId === page.id;
                return (
                  <div
                    key={page.id}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                    onClick={() => handleNavigate(page.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText
                          size={14}
                          className="shrink-0 text-zinc-400 dark:text-zinc-500"
                        />
                        <span className="truncate">{page.title}</span>
                      </div>
                      {getStatusBadge(page.status)}
                    </div>
                    {page.desc && (
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate pl-5">
                        {page.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t dark:border-zinc-700">
        <button
          className="w-full text-left px-2 py-1.5 flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md text-xs transition-colors"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus size={14} />
          <span>新建故事页</span>
        </button>
      </div>

      {showCreateDialog && (
        <StoryPageCreateDialog onClose={() => setShowCreateDialog(false)} />
      )}

      {showBoardCreateDialog && (
        <BoardCreateDialog onClose={() => setShowBoardCreateDialog(false)} />
      )}
    </div>
  );
}
