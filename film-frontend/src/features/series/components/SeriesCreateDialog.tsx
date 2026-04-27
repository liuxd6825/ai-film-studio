import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../../components/ui";

interface SeriesCreateDialogProps {
  onClose: () => void;
  onCreate: (title: string, desc: string) => void;
}

export function SeriesCreateDialog({
  onClose,
  onCreate,
}: SeriesCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate(title.trim(), desc.trim());
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-zinc-700">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">新建剧集</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="请输入剧集标题"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              简介
            </label>
            <textarea
              placeholder="请输入剧集简介（可选）"
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-zinc-50 dark:bg-zinc-700/50 dark:border-zinc-700">
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={!title.trim()}>
            创建
          </Button>
        </div>
      </div>
    </div>
  );
}
