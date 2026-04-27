import React, { useEffect, useRef } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import { Keyframe } from "../types";

interface CompactKeyframeRowProps {
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
        className="w-full h-6 px-1 text-[10px] border border-blue-500 rounded bg-white focus:outline-none"
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
    <div className="flex items-center gap-0.5">
      <input
        ref={inputRef}
        type="number"
        defaultValue={value}
        min={0}
        step={1}
        className="w-12 h-5 px-1 text-[10px] border border-blue-500 rounded bg-white focus:outline-none"
        onBlur={(e) => {
          const num = parseInt(e.target.value, 10);
          onSave(isNaN(num) ? 0 : num);
        }}
        onKeyDown={handleKeyDown}
      />
      {suffix && <span className="text-[10px] text-zinc-500">{suffix}</span>}
    </div>
  );
}

export function CompactKeyframeRow({
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
}: CompactKeyframeRowProps) {
  const isEditing = (field: string) =>
    editingField?.kfId === kf.id && editingField?.field === field;

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors ${
        dragging ? "opacity-50 scale-[0.98]" : ""
      } ${dragOver ? "bg-blue-50 border-blue-300" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(e, kf.id)}
      onDragOver={(e) => onDragOver(e, kf.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, kf.id)}
    >
      <div className="w-8 text-center text-[10px] text-zinc-400 font-mono shrink-0">
        F{kf.frameNumber?.toString().padStart(2, "0") ?? "--"}
      </div>

      <div className="w-16 h-9 rounded overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
        <img
          src={kf.thumbnailUrl}
          alt={`Frame ${kf.frameNumber}`}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="flex-1 min-w-0 text-[11px] text-zinc-700 truncate">
        {kf.actionDescription || "-"}
      </div>

      <div className="w-20 text-[11px] text-zinc-500 truncate shrink-0">
        {kf.soundEffects || "-"}
      </div>

      <div className="w-12 shrink-0">
        {isEditing("duration") ? (
          <InlineNumberInput
            value={parseInt(kf.duration) || 0}
            onSave={(v) => onInlineSave(kf.id, "duration", String(v))}
            onCancel={onCancelEdit}
            suffix="s"
          />
        ) : (
          <div
            className="text-[11px] text-zinc-500 text-center cursor-pointer hover:text-zinc-700"
            onClick={() => onStartEdit(kf.id, "duration")}
          >
            {kf.duration || "0s"}
          </div>
        )}
      </div>

      <div className="w-14 shrink-0">
        {isEditing("cameraShotType") ? (
          <InlineSelectInput
            value={kf.cameraShotType || ""}
            options={CAMERA_SHOT_TYPE_OPTIONS}
            onSave={(v) => onInlineSave(kf.id, "cameraShotType", v)}
            onCancel={onCancelEdit}
          />
        ) : (
          <div
            className="text-[10px] text-zinc-500 truncate cursor-pointer hover:text-zinc-700"
            onClick={() => onStartEdit(kf.id, "cameraShotType")}
          >
            {kf.cameraShotType || "-"}
          </div>
        )}
      </div>

      <div className="w-12 shrink-0">
        {isEditing("cameraAngle") ? (
          <InlineSelectInput
            value={kf.cameraAngle || ""}
            options={CAMERA_ANGLE_OPTIONS}
            onSave={(v) => onInlineSave(kf.id, "cameraAngle", v)}
            onCancel={onCancelEdit}
          />
        ) : (
          <div
            className="text-[10px] text-zinc-500 truncate cursor-pointer hover:text-zinc-700"
            onClick={() => onStartEdit(kf.id, "cameraAngle")}
          >
            {kf.cameraAngle || "-"}
          </div>
        )}
      </div>

      <div className="w-12 shrink-0">
        {isEditing("cameraMovement") ? (
          <InlineSelectInput
            value={kf.cameraMovement || ""}
            options={CAMERA_MOVEMENT_OPTIONS}
            onSave={(v) => onInlineSave(kf.id, "cameraMovement", v)}
            onCancel={onCancelEdit}
          />
        ) : (
          <div
            className="text-[10px] text-zinc-500 truncate cursor-pointer hover:text-zinc-700"
            onClick={() => onStartEdit(kf.id, "cameraMovement")}
          >
            {kf.cameraMovement || "-"}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(kf)}
          className="p-1 text-zinc-400 hover:text-blue-600 transition-colors"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={onInsertAfter}
          className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <Plus size={12} />
        </button>
        <button
          onClick={() => onDelete(kf.id)}
          className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
