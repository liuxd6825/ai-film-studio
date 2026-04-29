import { useCallback, useEffect, useState, useRef } from "react";
import { canvasTaskApi, VideoResult } from "../../../api/canvasTaskApi";
import { useCanvasStore } from "../stores/canvasStore";

interface VideoSelectorModalProps {
  projectId: string;
  nodeId: string;
  currentVideoUrl: string | null;
  onSelect: (videoUrl: string) => void;
  onClose: () => void;
}

export function VideoSelectorModal({
  projectId,
  nodeId,
  currentVideoUrl,
  onSelect,
  onClose,
}: VideoSelectorModalProps) {
  const setImageSelectorOpen = useCanvasStore((s) => s.setImageSelectorOpen);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(currentVideoUrl);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImageSelectorOpen(true);
    document.body.classList.add("image-selector-open");
    return () => {
      setImageSelectorOpen(false);
      document.body.classList.remove("image-selector-open");
    };
  }, [setImageSelectorOpen]);

  const loadVideos = useCallback(
    async (pageNum: number) => {
      if (loading) return;
      setLoading(true);
      try {
        const response = await canvasTaskApi.getNodeTaskImages(
          projectId,
          nodeId,
          pageNum,
          10,
        );
        if (pageNum === 1) {
          setVideos(response.images as [] || []);
        } else {
          setVideos((prev) => [...prev, ...(response.images as [] || [])]);
        }
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error("Failed to load videos:", error);
      } finally {
        setLoading(false);
      }
    },
    [projectId, nodeId, loading],
  );

  useEffect(() => {
    loadVideos(1);
  }, [loadVideos]);

  const handleClose = useCallback(() => {
    setImageSelectorOpen(false);
    document.body.classList.remove("image-selector-open");
    onClose();
  }, [setImageSelectorOpen, onClose]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const bottom =
        target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
      if (bottom && page < totalPages && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadVideos(nextPage);
      }
    },
    [page, totalPages, loading, loadVideos],
  );

  const handleVideoClick = (url: string) => {
    setSelectedUrl(url);
  };

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
      onClick={handleClose}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-[95vw] max-h-[75vh] max-w-8xl min-w-[600px] flex flex-col shadow-xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-1.5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">选择视频</h3>
          <button
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl w-8 h-8 flex items-center justify-center"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 min-h-0"
          onScroll={handleScroll}
        >
          {videos.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500 dark:text-gray-400">
              暂无视频
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {videos.map((video) => (
                <div
                  key={video.resultId}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedUrl === video.url
                      ? "border-blue-500 ring-2 ring-blue-300 dark:ring-blue-500"
                      : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => handleVideoClick(video.url)}
                >
                  <video
                    src={video.url}
                    className="w-full h-auto object-contain"
                    preload="metadata"
                    onError={(e) => {
                      (e.target as HTMLVideoElement).poster = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E视频加载失败%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  {selectedUrl === video.url && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-1.5 border-t border-gray-200 dark:border-gray-700">
          <button
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            onClick={handleClose}
          >
            取消
          </button>
          <button
            className={`px-4 py-2 rounded text-sm ${
              selectedUrl
                ? "bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
            onClick={handleConfirm}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}