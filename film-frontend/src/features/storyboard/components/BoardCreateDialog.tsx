import { useState } from "react";
import { X } from "lucide-react";
import { useStoryboardStore } from "../store";

interface BoardCreateDialogProps {
  onClose: () => void;
}

export function BoardCreateDialog({ onClose }: BoardCreateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { projectId, createBoard, fetchBoards } = useStoryboardStore();

  const handleCreate = async () => {
    if (!name.trim() || !projectId) return;
    setIsCreating(true);
    try {
      const newBoard = await createBoard(projectId, {
        name: name.trim(),
        description,
      });
      if (newBoard) {
        await fetchBoards(projectId);
        onClose();
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-80">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">创建分镜看板</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">看板名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：第1集分镜"
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述这个看板的用途..."
              rows={3}
              className="w-full px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t bg-zinc-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-200 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? "创建中..." : "创建"}
          </button>
        </div>
      </div>
    </div>
  );
}
