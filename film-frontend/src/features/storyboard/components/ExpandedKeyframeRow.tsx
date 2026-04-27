import React, { useEffect, useRef } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import { Keyframe } from "../types";

interface ExpandedKeyframeRowProps {
  kf: Keyframe;
  onEdit: (kf: Keyframe) => void;
  onDelete: (kfId: string) => void;
  onInsertAfter: () => void;
  onInlineSave: (kfId: string, field: string, value: any) => void;
  dragging?: boolean;
  dragOver?: boolean;
  onDragStart: (e: React.DragEvent, kfId: string) => void;
  onDragOver: (e: React.DragEvent, kfId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, kfId: string) => void;
  editingField?: { kfId: string; field: string } | null;
  onStartEdit: (kfId: string, field: string) => void;
  onCancelEdit: () => void;
}

const CAMERA_SHOT_TYPE_OPTIONS = ["全景", "中景", "近景", "特写", "过肩"];
const CAMERA_ANGLE_OPTIONS = ["平视", "俯拍", "仰拍", "鸟瞰"];
const CAMERA_MOVEMENT_OPTIONS = [
  "固定",
  "推",
  "拉",
  "左摇",
  "右摇",
  "上摇",
  "下摇",
  "左移",
  "右移",
  "上升",
  "下降",
  "前跟",
  "后跟",
  "左环绕",
  "右环绕",
  "手持",
];

function InlineSelectInput({
  value,
  options,
  onSave,
  onCancel,
}: {
  value: string;
  options: string[];
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSave((e.target as HTMLInputElement).value);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        list={`kf-datalist-${options[0]}`}
        className="w-full h-6 px-2 text-xs border border-blue-500 rounded bg-white focus:outline-none"
        onBlur={(e) => onSave(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <datalist id={`kf-datalist-${options[0]}`}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}

function InlineNumberInput({
  value,
  onSave,
  onCancel,
  suffix = "",
}: {
  value: number;
  onSave: (value: number) => void;
  onCancel: () => void;
  suffix?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const num = parseInt((e.target as HTMLInputElement).value, 10);
      onSave(isNaN(num) ? 0 : num);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="number"
        defaultValue={value}
        min={0}
        step={1}
        className="w-16 h-6 px-2 text-xs border border-blue-500 rounded bg-white focus:outline-none"
        onBlur={(e) => {
          const num = parseInt(e.target.value, 10);
          onSave(isNaN(num) ? 0 : num);
        }}
        onKeyDown={handleKeyDown}
      />
      {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
    </div>
  );
}

function InlineTextarea({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      defaultValue={value}
      className="w-full min-h-[60px] px-2 py-1 text-xs border border-blue-500 rounded bg-white focus:outline-none resize-none"
      onBlur={(e) => onSave(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}

export function ExpandedKeyframeRow({
  kf,
  onEdit,
  onDelete,
  onInsertAfter,
  onInlineSave,
  dragging,
  dragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  editingField,
  onStartEdit,
  onCancelEdit,
}: ExpandedKeyframeRowProps) {
  const isEditing = (field: string) =>
    editingField?.kfId === kf.id && editingField?.field === field;

  return (
    <div
      className={`border-b border-zinc-200 last:border-b-0 transition-colors ${
        dragging ? "opacity-50" : ""
      } ${dragOver ? "bg-blue-50" : "hover:bg-zinc-50"}`}
      draggable
      onDragStart={(e) => onDragStart(e, kf.id)}
      onDragOver={(e) => onDragOver(e, kf.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, kf.id)}
    >
      <div className="flex items-stretch">
        <div className="p-2 shrink-0">
          <div className="w-40 h-full min-h-[180px] rounded overflow-hidden bg-zinc-100 border border-zinc-200 relative">
            <div className="absolute top-0 left-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-br backdrop-blur-sm z-10 font-mono">
              F{kf.frameNumber?.toString().padStart(2, "0") ?? "--"}
            </div>
            <img
              src={kf.thumbnailUrl}
              alt={`Frame ${kf.frameNumber}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="flex-1 p-2 space-y-1.5 min-w-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-400 uppercase w-16">
                属性:
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-400 uppercase">
                时长:
              </span>
              {isEditing("duration") ? (
                <InlineNumberInput
                  value={parseInt(kf.duration) || 0}
                  onSave={(v) => onInlineSave(kf.id, "duration", String(v))}
                  onCancel={onCancelEdit}
                  suffix="s"
                />
              ) : (
                <div
                  className="text-[11px] text-zinc-700 cursor-pointer hover:text-blue-600"
                  onClick={() => onStartEdit(kf.id, "duration")}
                >
                  {kf.duration || "0s"}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-400 uppercase">机位:</span>
              {isEditing("cameraShotType") ? (
                <InlineSelectInput
                  value={kf.cameraShotType || ""}
                  options={CAMERA_SHOT_TYPE_OPTIONS}
                  onSave={(v) => onInlineSave(kf.id, "cameraShotType", v)}
                  onCancel={onCancelEdit}
                />
              ) : (
                <div
                  className="text-[11px] text-zinc-700 cursor-pointer hover:text-blue-600"
                  onClick={() => onStartEdit(kf.id, "cameraShotType")}
                >
                  {kf.cameraShotType || "-"}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-400 uppercase">角度:</span>
              {isEditing("cameraAngle") ? (
                <InlineSelectInput
                  value={kf.cameraAngle || ""}
                  options={CAMERA_ANGLE_OPTIONS}
                  onSave={(v) => onInlineSave(kf.id, "cameraAngle", v)}
                  onCancel={onCancelEdit}
                />
              ) : (
                <div
                  className="text-[11px] text-zinc-700 cursor-pointer hover:text-blue-600"
                  onClick={() => onStartEdit(kf.id, "cameraAngle")}
                >
                  {kf.cameraAngle || "-"}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-400 uppercase">运动:</span>
              {isEditing("cameraMovement") ? (
                <InlineSelectInput
                  value={kf.cameraMovement || ""}
                  options={CAMERA_MOVEMENT_OPTIONS}
                  onSave={(v) => onInlineSave(kf.id, "cameraMovement", v)}
                  onCancel={onCancelEdit}
                />
              ) : (
                <div
                  className="text-[11px] text-zinc-700 cursor-pointer hover:text-blue-600"
                  onClick={() => onStartEdit(kf.id, "cameraMovement")}
                >
                  {kf.cameraMovement || "-"}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-[9px] text-zinc-400 uppercase w-16 shrink-0">
              静态词:
            </span>
            {isEditing("imagePrompt") ? (
              <InlineTextarea
                value={kf.imagePrompt || ""}
                onSave={(v) => onInlineSave(kf.id, "imagePrompt", v)}
                onCancel={onCancelEdit}
              />
            ) : (
              <div
                className="flex-1 text-[11px] text-zinc-700 bg-zinc-50 rounded px-2 py-1 cursor-pointer hover:bg-zinc-100 truncate"
                onClick={() => onStartEdit(kf.id, "imagePrompt")}
              >
                {kf.imagePrompt || "-"}
              </div>
            )}
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[9px] text-zinc-400 uppercase w-16 shrink-0">
              动态词:
            </span>
            {isEditing("actionDescription") ? (
              <InlineTextarea
                value={kf.actionDescription || ""}
                onSave={(v) => onInlineSave(kf.id, "actionDescription", v)}
                onCancel={onCancelEdit}
              />
            ) : (
              <div
                className="flex-1 text-[11px] text-zinc-700 bg-zinc-50 rounded px-2 py-1 cursor-pointer hover:bg-zinc-100"
                onClick={() => onStartEdit(kf.id, "actionDescription")}
              >
                {kf.actionDescription || "-"}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2">
            <span className="text-[9px] text-zinc-400 uppercase w-16 shrink-0">
              音效:
            </span>
            {isEditing("soundEffects") ? (
              <InlineTextarea
                value={kf.soundEffects || ""}
                onSave={(v) => onInlineSave(kf.id, "soundEffects", v)}
                onCancel={onCancelEdit}
              />
            ) : (
              <div
                className="flex-1 text-[11px] text-zinc-700 bg-zinc-50 rounded px-2 py-1 cursor-pointer hover:bg-zinc-100"
                onClick={() => onStartEdit(kf.id, "soundEffects")}
              >
                {kf.soundEffects || "-"}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2">
            <span className="text-[9px] text-zinc-400 uppercase w-16 shrink-0">
              说明:
            </span>
            {isEditing("description") ? (
              <InlineTextarea
                value={kf.description || ""}
                onSave={(v) => onInlineSave(kf.id, "description", v)}
                onCancel={onCancelEdit}
              />
            ) : (
              <div
                className="flex-1 text-[11px] text-zinc-700 bg-zinc-50 rounded px-2 py-1 cursor-pointer hover:bg-zinc-100"
                onClick={() => onStartEdit(kf.id, "description")}
              >
                {kf.description || "-"}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 px-2">
          <button
            onClick={() => onEdit(kf)}
            className="p-1 text-zinc-400 hover:text-blue-600 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onInsertAfter}
            className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onDelete(kf.id)}
            className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
