import { useCallback, useEffect, useRef, useState } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import { Pause, Play } from "lucide-react";

export function AudioPlayerModal() {
  const audioPlayer = useCanvasStore((state) => state.audioPlayer);
  const closeAudioPlayer = useCanvasStore((state) => state.closeAudioPlayer);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!audioPlayer.isOpen) return;
      if (e.key === "Escape") {
        closeAudioPlayer();
      }
    },
    [audioPlayer.isOpen, closeAudioPlayer],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (audioPlayer.isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [audioPlayer.isOpen, audioPlayer.audioUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (!audioPlayer.isOpen || !audioPlayer.audioUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={closeAudioPlayer}
    >
      <div
        className="relative w-full max-w-xl mx-4 p-6 rounded-xl bg-white dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          onClick={closeAudioPlayer}
        >
          ×
        </button>

        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          音频播放
        </h3>

        <audio
          ref={audioRef}
          src={audioPlayer.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-white"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 w-12">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400 w-12">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {audioPlayer.fileName || "audio"}
        </div>
      </div>
    </div>
  );
}