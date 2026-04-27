import { useState, useEffect } from "react";
import { useSeriesStore } from "../store";
import { Button } from "../../../components/ui";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const STATUS_OPTIONS = [
  { value: 0, label: "草稿" },
  { value: 1, label: "进行中" },
  { value: 2, label: "已完成" },
];

export function SeriesEditPanel() {
  const { editingStoryPage, updateEditingField, saveStoryPage } =
    useSeriesStore();

  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveStoryPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveStoryPage]);

  if (!editingStoryPage) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
        <p>请从左侧选择一个剧集进行编辑</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-700">
        <input
          type="text"
          value={editingStoryPage.title}
          onChange={(e) => updateEditingField("title", e.target.value)}
          placeholder="输入剧集标题..."
          className="flex-1 text-xl font-bold border-0 focus:outline-none focus:ring-0 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 dark:text-zinc-100"
        />
        <Button variant="outline" onClick={() => setIsPreview(!isPreview)}>
          {isPreview ? "编辑" : "预览"}
        </Button>
        <select
          value={editingStoryPage.status}
          onChange={(e) =>
            updateEditingField("status", Number(e.target.value))
          }
          className="h-10 px-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Button variant="default" onClick={saveStoryPage}>
          保存
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isPreview ? (
          <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {editingStoryPage.desc || "*暂无内容*"}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={editingStoryPage.desc || ""}
            onChange={(e) => updateEditingField("desc", e.target.value)}
            placeholder="请输入剧集简介..."
            className="w-full h-full p-4 text-sm border-0 resize-none focus:outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        )}
      </div>
    </div>
  );
}