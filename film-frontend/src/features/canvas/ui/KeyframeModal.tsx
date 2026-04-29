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

async function extractFrame(
  videoUrl: string,
  timestamp: number,
): Promise<{ imageUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = replaceBaseUrl(videoUrl);
    video.muted = true;
    video.preload = "auto";

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolve({
          imageUrl: canvas.toDataURL("image/jpeg", 0.85),
          width: video.videoWidth,
          height: video.videoHeight,
        });
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };

    video.onerror = () => reject(new Error("Failed to load video"));
    video.currentTime = timestamp;
  });
}

function replaceBaseUrl(s: string) {
  if(!s) {
    return ""
  }
  const sBaseUrl = s.substring(0, s.indexOf('/', 7));
  return s.replace(sBaseUrl, window.location.origin)
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
    try {
      const frameData = await extractFrame(videoUrl, currentTime);
      onExtract(currentTime, frameData.imageUrl, frameData.width, frameData.height);
      onClose();
    } catch (error) {
      console.error("Failed to extract frame:", error);
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
              src={videoUrl}
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