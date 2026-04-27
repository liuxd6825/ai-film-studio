import { useCallback, useEffect } from "react";
import { useCanvasStore } from "../stores/canvasStore";

export function ImageViewerModal() {
  const imageViewer = useCanvasStore((state) => state.imageViewer);
  const closeImageViewer = useCanvasStore((state) => state.closeImageViewer);
  const navigateImageViewer = useCanvasStore(
    (state) => state.navigateImageViewer,
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!imageViewer.isOpen) return;

      if (e.key === "Escape") {
        closeImageViewer();
      } else if (e.key === "ArrowLeft") {
        navigateImageViewer("prev");
      } else if (e.key === "ArrowRight") {
        navigateImageViewer("next");
      }
    },
    [imageViewer.isOpen, closeImageViewer, navigateImageViewer],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!imageViewer.isOpen || !imageViewer.currentImageUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={closeImageViewer}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
          onClick={closeImageViewer}
        >
          ×
        </button>

        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-gray-300 z-10 disabled:opacity-30"
          onClick={() => navigateImageViewer("prev")}
          disabled={imageViewer.currentIndex === 0}
        >
          ‹
        </button>

        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-gray-300 z-10 disabled:opacity-30"
          onClick={() => navigateImageViewer("next")}
          disabled={
            imageViewer.currentIndex === imageViewer.imageList.length - 1
          }
        >
          ›
        </button>

        <img
          src={imageViewer.currentImageUrl}
          alt=""
          className="max-w-full max-h-[85vh] object-contain"
        />

        {imageViewer.imageList.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {imageViewer.currentIndex + 1} / {imageViewer.imageList.length}
          </div>
        )}
      </div>
    </div>
  );
}
