import { memo, useState, useRef, useCallback } from "react";

interface EditableNodeTitleProps {
  nodeType: string;
  title: string;
  onSave: (title: string) => void;
  maxLength?: number;
}

export const EditableNodeTitle = memo(function EditableNodeTitle({
  nodeType,
  title,
  onSave,
  maxLength = 50,
}: EditableNodeTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback(() => {
    setEditValue(title);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [title]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.slice(0, maxLength).trim();
    onSave(trimmed);
    setIsEditing(false);
  }, [editValue, maxLength, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(title);
    setIsEditing(false);
  }, [title]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  return (
    <span
      className="font-medium text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
      onDoubleClick={handleDoubleClick}
    >
      {nodeType}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          className="ml-1 px-1 py-0.5 text-sm border border-blue-400 rounded outline-none bg-white dark:bg-gray-700"
          style={{ width: `${Math.max(60, editValue.length * 8 + 20)}px` }}
        />
      ) : (
        title && <span className="ml-1">{title}</span>
      )}
    </span>
  );
});
