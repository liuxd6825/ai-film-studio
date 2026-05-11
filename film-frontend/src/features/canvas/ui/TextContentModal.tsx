import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useCanvasStore } from "../stores/canvasStore";

export function TextContentModal() {
  const contentEditor = useCanvasStore((state) => state.contentEditor);
  const closeContentEditor = useCanvasStore((state) => state.closeContentEditor);
  const updateContentEditorContent = useCanvasStore(
    (state) => state.updateContentEditorContent,
  );
  const updateNodeData = useCanvasStore((state) => state.updateNodeData);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);

  const handleSave = useCallback(() => {
    const newContent = textareaRef.current?.value || "";
    if (contentEditor.nodeId) {
      updateNodeData(contentEditor.nodeId, { content: newContent });
    }
    closeContentEditor();
  }, [contentEditor.nodeId, updateNodeData, closeContentEditor]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        closeContentEditor();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    },
    [closeContentEditor, handleSave],
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeContentEditor();
      }
    },
    [closeContentEditor],
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (_e: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false;
      if (textareaRef.current) {
        updateContentEditorContent(textareaRef.current.value);
      }
    },
    [updateContentEditorContent],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isComposingRef.current) return;
      updateContentEditorContent(e.target.value);
    },
    [updateContentEditorContent],
  );

  if (!contentEditor.isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={handleOverlayClick}
    >
      <div
        className="fixed inset-0 w-screen h-screen bg-white dark:bg-gray-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">文本内容</h2>
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={closeContentEditor}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          defaultValue={contentEditor.content}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onChange={handleChange}
          className="flex-1 w-full p-6 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none overflow-y-auto"
          placeholder="输入文本内容..."
        />

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={closeContentEditor}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}