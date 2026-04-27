import { useState } from "react";
import { X } from "lucide-react";
import { useStoryboardStore } from "../store";
import { Button } from "./ui";

interface StoryPageCreateDialogProps {
  onClose: () => void;
}

export function StoryPageCreateDialog({ onClose }: StoryPageCreateDialogProps) {
  const {
    boards,
    currentBoardId,
    createStoryPage,
    setSelectedStoryPageId,
    setShotNavPage,
  } = useStoryboardStore();
  const currentBoard = boards.find((b) => b.id === currentBoardId);
  const projectId = currentBoard?.projectId;
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    console.log("handleCreate called", {
      title,
      currentBoardId,
      projectId,
      boardsLength: boards.length,
    });
    if (!title.trim() || !currentBoardId || !projectId) {
      console.log("Early return because:", {
        hasTitle: !!title.trim(),
        hasCurrentBoardId: !!currentBoardId,
        hasProjectId: !!projectId,
      });
      return;
    }

    setIsCreating(true);
    try {
      const newPage = await createStoryPage(projectId, currentBoardId, {
        title: title.trim(),
        desc: desc.trim(),
      });
      console.log("createStoryPage result:", newPage);
      if (newPage) {
        setSelectedStoryPageId(newPage.id);
        setShotNavPage(0);
        onClose();
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <h3 className="font-medium text-zinc-900">新建故事页</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="请输入故事页标题"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              简介
            </label>
            <textarea
              placeholder="请输入故事页简介（可选）"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-zinc-100 bg-zinc-50/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
          >
            {isCreating ? "创建中..." : "创建"}
          </Button>
        </div>
      </div>
    </div>
  );
}
