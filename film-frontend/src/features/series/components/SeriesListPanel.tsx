import { useState } from "react";
import { Search, Plus, Clock, Cloud } from "lucide-react";
import { useSeriesStore } from "../store";
import { Button, Badge } from "../../../components/ui";
import { SeriesCreateDialog } from "./SeriesCreateDialog";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "0", label: "草稿" },
  { value: "1", label: "进行中" },
  { value: "2", label: "已完成" },
];

const getStatusBadge = (status: number) => {
  switch (status) {
    case 2:
      return <Badge variant="default">已完成</Badge>;
    case 1:
      return <Badge variant="secondary">进行中</Badge>;
    default:
      return <Badge variant="outline">草稿</Badge>;
  }
};

export function SeriesListPanel() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const {
    allStoryPages,
    selectedStoryPageId,
    selectStoryPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    createStoryPage,
  } = useSeriesStore();

  const filteredPages = allStoryPages
    .filter((page) => {
      if (
        statusFilter !== null &&
        statusFilter !== "all" &&
        page.status !== Number(statusFilter)
      ) {
        return false;
      }
      if (
        searchQuery &&
        !page.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="w-80 shrink-0 flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700">
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-700 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="搜索剧集..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>
        <select
          value={statusFilter ?? "all"}
          onChange={(e) =>
            setStatusFilter(e.target.value === "all" ? null : e.target.value)
          }
          className="w-full h-8 px-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredPages.map((page) => (
          <div
            key={page.id}
            onClick={() => selectStoryPage(page.id)}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedStoryPageId === page.id
                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-sm truncate text-zinc-900 dark:text-zinc-100">{page.title}</span>
              {getStatusBadge(page.status)}
            </div>
            {page.desc && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">
                {page.desc}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {page.storyTime}
              </span>
              <span className="flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                {page.weather}
              </span>
            </div>
          </div>
        ))}
        {filteredPages.length === 0 && (
          <div className="text-center text-sm text-zinc-400 dark:text-zinc-500 py-8">暂无剧集</div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
        <Button
          variant="default"
          className="w-full"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4" />
          新建剧集
        </Button>
      </div>
      {showCreateDialog && (
        <SeriesCreateDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={async (title, desc) => {
            const newPage = await createStoryPage(title, desc);
            if (newPage) {
              selectStoryPage(newPage.id);
              setShowCreateDialog(false);
            }
          }}
        />
      )}
    </div>
  );
}