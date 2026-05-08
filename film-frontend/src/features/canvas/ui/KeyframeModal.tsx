import { useCallback, useEffect, useRef, useState } from "react";
import { X, SkipBack, SkipForward } from "lucide-react";

interface KeyframeModalProps {
  nodeId: string;
  videoUrl: string;
  duration: number;
  onClose: () => void;
  onExtract: (
    timestamp: number,
    imageUrl: string,
    width?: number,
    height?: number,
  ) => void;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`;
}

function replaceBaseUrl(s: string): string {
  if (!s) {
    return "";
  }
  if (s.startsWith("data:")) {
    return s;
  }
  if (!s.startsWith("http://") && !s.startsWith("https://")) {
    if (s.startsWith("/")) {
      return window.location.origin + s;
    }
    return window.location.origin + "/" + s;
  }
  const slashIndex = s.indexOf("/", 7);
  if (slashIndex === -1) {
    return window.location.origin;
  }
  const baseUrl = s.substring(0, slashIndex);
  return s.replace(baseUrl, window.location.origin);
}

async function extractFrame(
  videoUrl: string,
  timestamp: number,
  timeout: number = 10000,
): Promise<{ imageUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const resolvedUrl = replaceBaseUrl(videoUrl);
    console.log("[extractFrame] original url:", videoUrl, "resolved url:", resolvedUrl);
    video.src = resolvedUrl;
    video.muted = true;
    video.preload = "auto";

    let timeoutId: ReturnType<typeof setTimeout>;
    let settled = false;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      video.onseeked = null;
      video.onerror = null;
      video.onloadedmetadata = null;
    };

    const resolveOnce = (value: { imageUrl: string; width: number; height: number }) => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(value);
      }
    };

    const rejectOnce = (error: Error) => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(error);
      }
    };

    timeoutId = setTimeout(() => {
      rejectOnce(new Error("提取关键帧超时，请检查视频是否可加载"));
    }, timeout);

    video.onloadedmetadata = () => {
      console.log("[extractFrame] onloadedmetadata fired, readyState:", video.readyState);
      video.currentTime = timestamp;
    };

    video.onseeked = () => {
      console.log("[extractFrame] onseeked fired, videoWidth:", video.videoWidth, "videoHeight:", video.videoHeight);
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        rejectOnce(new Error("视频尺寸无效，无法提取帧"));
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolveOnce({
          imageUrl: canvas.toDataURL("image/jpeg", 0.85),
          width: video.videoWidth,
          height: video.videoHeight,
        });
      } else {
        rejectOnce(new Error("无法获取画布上下文"));
      }
    };

    video.onerror = () => {
      console.error("[extractFrame] video onerror, src:", video.src);
      rejectOnce(new Error("视频加载失败，请检查视频链接是否有效"));
    };

    video.load();
  });
}

export function KeyframeModal({
  nodeId: _nodeId,
  videoUrl,
  duration,
  onClose,
  onExtract,
}: KeyframeModalProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;

      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [duration],
  );

  const handleFirstFrame = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, []);

  const handleLastFrame = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, duration - 0.1);
      setCurrentTime(Math.max(0, duration - 0.1));
    }
  }, [duration]);

  const handleExtract = useCallback(async () => {
    setIsExtracting(true);
    setExtractError(null);
    try {
      const frameData = await extractFrame(videoUrl, currentTime);
      await onExtract(currentTime, frameData.imageUrl, frameData.width, frameData.height);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "提取关键帧失败";
      console.error("Failed to extract frame:", error);
      setExtractError(errorMessage);
    } finally {
      setIsExtracting(false);
    }
  }, [videoUrl, currentTime, onExtract, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={handleOverlayClick}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-[640px] max-h-[90vh] flex flex-col shadow-xl pointer-events-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">添加关键帧</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              src={replaceBaseUrl(videoUrl)}
              className="w-full h-auto max-h-[360px] object-contain"
              muted
              preload="auto"
            />
          </div>

          <div className="mb-4">
            <div
              className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded cursor-pointer"
              onClick={handleTimelineClick}
            >
              <div
                className="absolute left-0 top-0 h-full bg-blue-500 dark:bg-blue-400 rounded"
                style={{ width: `${percentage}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 dark:border-blue-400 rounded-full shadow"
                style={{ left: `calc(${percentage}% - 8px)` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFirstFrame}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="首帧"
              >
                <SkipBack className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                type="button"
                onClick={handleLastFrame}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="尾帧"
              >
                <SkipForward className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              当前选择: <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{formatTimestamp(currentTime)}</span>
            </div>
          </div>

          {extractError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              {extractError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleExtract}
              disabled={isExtracting}
              className="px-4 py-2 text-sm bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
            >
              {isExtracting ? "提取中..." : "提取关键帧"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
