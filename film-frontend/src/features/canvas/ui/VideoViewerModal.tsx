import { useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "../stores/canvasStore";

export function VideoViewerModal() {
  const videoViewer = useCanvasStore((state) => state.videoViewer);
  const closeVideoViewer = useCanvasStore((state) => state.closeVideoViewer);
  const navigateVideoViewer = useCanvasStore(
    (state) => state.navigateVideoViewer,
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!videoViewer.isOpen) return;

      if (e.key === "Escape") {
        closeVideoViewer();
      } else if (e.key === "ArrowLeft") {
        navigateVideoViewer("prev");
      } else if (e.key === "ArrowRight") {
        navigateVideoViewer("next");
      }
    },
    [videoViewer.isOpen, closeVideoViewer, navigateVideoViewer],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (videoRef.current && videoViewer.isOpen) {
      videoRef.current.load();
    }
  }, [videoViewer.currentVideoUrl, videoViewer.isOpen]);

  if (!videoViewer.isOpen || !videoViewer.currentVideoUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={closeVideoViewer}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
          onClick={closeVideoViewer}
        >
          ×
        </button>

        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-gray-300 z-10 disabled:opacity-30"
          onClick={() => navigateVideoViewer("prev")}
          disabled={videoViewer.currentIndex === 0}
        >
          ‹
        </button>

        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-gray-300 z-10 disabled:opacity-30"
          onClick={() => navigateVideoViewer("next")}
          disabled={
            videoViewer.currentIndex === videoViewer.videoList.length - 1
          }
        >
          ›
        </button>

        <video
          ref={videoRef}
          src={videoViewer.currentVideoUrl}
          className="max-w-full max-h-[85vh] object-contain"
          controls
          autoPlay
        />

        {videoViewer.videoList.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {videoViewer.currentIndex + 1} / {videoViewer.videoList.length}
          </div>
        )}
      </div>
    </div>
  );
}