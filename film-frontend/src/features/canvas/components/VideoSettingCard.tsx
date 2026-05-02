import { memo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export interface VideoSettingCardProps {
  aspectRatioValue: string;
  aspectRatioOptions: { value: string; label: string }[];
  onAspectRatioChange: (value: string) => void;
  resolutionValue: string;
  resolutionOptions: { value: string; label: string }[];
  onResolutionChange: (value: string) => void;
  durationValue: string;
  durationOptions: { value: string; label: string }[];
  onDurationChange: (value: number) => void;
}

export const VideoSettingCard = memo(function VideoSettingCard({
  aspectRatioValue,
  aspectRatioOptions,
  onAspectRatioChange,
  resolutionValue,
  resolutionOptions,
  onResolutionChange,
  durationValue,
  durationOptions,
  onDurationChange,
}: VideoSettingCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current?.offsetHeight || 120;
      setPosition({
        top: rect.top - dropdownHeight - 8,
        left: rect.left,
      });
    }
  }, [isOpen]);

  const handleAspectRatioChange = useCallback(
    (value: string) => {
      onAspectRatioChange(value);
    },
    [onAspectRatioChange],
  );

  const handleResolutionChange = useCallback(
    (value: string) => {
      onResolutionChange(value);
    },
    [onResolutionChange],
  );

  const handleDurationChange = useCallback(
    (value: string) => {
      onDurationChange(Number(value));
    },
    [onDurationChange],
  );

  const currentResolutionLabel = resolutionOptions.find(
    (opt) => opt.value === resolutionValue,
  )?.label || resolutionValue;

  const currentDurationLabel = durationOptions.find(
    (opt) => opt.value === durationValue,
  )?.label || `${durationValue}秒`;

  const currentLabel = `${aspectRatioValue} , ${currentResolutionLabel} , ${currentDurationLabel}`;

  return (
    <div data-video-setting-card="true" className="relative">
      <button
        ref={triggerRef}
        type="button"
        data-video-setting-trigger="true"
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        <span>{currentLabel}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <>
            <div
              onClick={() => setIsOpen(false)}
              data-video-setting-overlay="true"
              className="fixed inset-0 z-[9998]"
            />
            <div
              data-video-setting-dropdown="true"
              ref={dropdownRef}
              style={{ top: position.top, left: position.left }}
              className="fixed z-[9999] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-3 min-w-[280px]"
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-row gap-2 flex-wrap items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 w-10">
                    比例
                  </span>
                  {aspectRatioOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAspectRatioChange(option.value)}
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                        aspectRatioValue === option.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-row gap-2 flex-wrap items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 w-10">
                    分辨率
                  </span>
                  {resolutionOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleResolutionChange(option.value)}
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                        resolutionValue === option.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-2 flex-wrap items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 w-10">
                      时长
                    </span>
                    {durationOptions.slice(0, 6).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleDurationChange(option.value)}
                        className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                          durationValue === option.value
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-row gap-2 flex-wrap items-center pl-[52px]">
                    {durationOptions.slice(6).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleDurationChange(option.value)}
                        className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                          durationValue === option.value
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
});