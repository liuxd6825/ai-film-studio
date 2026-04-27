import { useState, useEffect, useRef, useCallback } from "react";
import { X, Save, Video } from "lucide-react";
import { Shot } from "../types";
import { Button } from "./ui";

interface ShotEditDialogProps {
  shot: Shot;
  isNew?: boolean;
  onSave: (shot: Shot) => Promise<void> | void;
  onClose: () => void;
}

export function ShotEditDialog({
  shot,
  isNew = false,
  onSave,
  onClose,
}: ShotEditDialogProps) {
  const [formData, setFormData] = useState<Shot>(shot);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(shot);
  }, [shot]);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleChange = (field: keyof Shot, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if ((formData.duration ?? 0) < 0) {
      newErrors.duration = "时长不能为负数";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch {
      setErrors((prev) => ({ ...prev, _form: "保存失败，请重试" }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl flex flex-col overflow-hidden"
      >
        <div className="px-4 py-3 border-b flex items-center justify-between bg-zinc-50">
          <h3
            id="dialog-title"
            className="font-semibold text-zinc-900 flex items-center gap-2"
          >
            <Video size={16} className="text-zinc-500" />
            {isNew ? "新建镜头" : "编辑镜头"}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh] flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1">
                镜头编号
              </label>
              <div className="w-full text-sm border border-zinc-200 rounded-md p-2 bg-zinc-50 text-zinc-500">
                {formData.orderNum > 0 ? formData.orderNum : "自动分配"}
              </div>
            </div>
            <div>
              <label
                htmlFor="duration"
                className="text-xs font-medium text-zinc-700 block mb-1"
              >
                时长（秒）
              </label>
              <input
                id="duration"
                ref={firstInputRef}
                type="number"
                value={formData.duration || 0}
                onChange={(e) =>
                  handleChange("duration", parseInt(e.target.value) || 0)
                }
                aria-describedby={
                  errors.duration ? "duration-error" : undefined
                }
                className={`w-full text-sm border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 ${errors.duration ? "border-red-500" : "border-zinc-200"}`}
              />
              {errors.duration && (
                <p id="duration-error" className="text-xs text-red-500 mt-1">
                  {errors.duration}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="scene-type"
                className="text-xs font-medium text-zinc-700 block mb-1"
              >
                内外景
              </label>
              <input
                id="scene-type"
                list="scene-type-options"
                value={formData.sceneType || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sceneType: e.target.value,
                  }))
                }
                placeholder="请选择或输入"
                className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              />
              <datalist id="scene-type-options">
                <option value="内景" />
                <option value="外景" />
                <option value="混合" />
              </datalist>
            </div>
            <div>
              <label
                htmlFor="weather"
                className="text-xs font-medium text-zinc-700 block mb-1"
              >
                天气
              </label>
              <input
                id="weather"
                list="weather-options"
                value={formData.weather || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, weather: e.target.value }))
                }
                placeholder="请选择或输入"
                className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              />
              <datalist id="weather-options">
                <option value="晴" />
                <option value="雨" />
                <option value="阴" />
                <option value="雪" />
                <option value="雾" />
                <option value="风" />
              </datalist>
            </div>
            <div>
              <label
                htmlFor="time-frame"
                className="text-xs font-medium text-zinc-700 block mb-1"
              >
                时间段
              </label>
              <input
                id="time-frame"
                list="time-frame-options"
                value={formData.timeFrame || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeFrame: e.target.value,
                  }))
                }
                placeholder="请选择或输入"
                className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              />
              <datalist id="time-frame-options">
                <option value="清晨" />
                <option value="上午" />
                <option value="中午" />
                <option value="下午" />
                <option value="傍晚" />
                <option value="夜晚" />
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="lighting"
                className="text-xs font-medium text-zinc-700 block mb-1"
              >
                光影
              </label>
              <input
                id="lighting"
                list="lighting-options"
                value={formData.lighting || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lighting: e.target.value }))
                }
                placeholder="请选择或输入"
                className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              />
              <datalist id="lighting-options">
                <option value="自然光" />
                <option value="人工光" />
                <option value="逆光" />
                <option value="侧光" />
                <option value="顶光" />
              </datalist>
            </div>
            <div>
              <label
                htmlFor="camera-angle-h"
                className="text-xs font-medium text-zinc-700 block mb-1"
              >
                水平机位
              </label>
              <input
                id="camera-angle-h"
                list="camera-angle-h-options"
                value={formData.cameraAngleH || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cameraAngleH: e.target.value,
                  }))
                }
                placeholder="请选择或输入"
                className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              />
              <datalist id="camera-angle-h-options">
                <option value="正面" />
                <option value="侧面" />
                <option value="背面" />
                <option value="斜侧面" />
              </datalist>
            </div>
            <div>
              <label
                htmlFor="camera-angle-v"
                className="text-xs font-medium text-zinc-700 block mb-1"
              >
                垂直机位
              </label>
              <input
                id="camera-angle-v"
                list="camera-angle-v-options"
                value={formData.cameraAngleV || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cameraAngleV: e.target.value,
                  }))
                }
                placeholder="请选择或输入"
                className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              />
              <datalist id="camera-angle-v-options">
                <option value="平视" />
                <option value="仰视" />
                <option value="俯视" />
                <option value="鸟瞰" />
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="narrative-pov"
                className="text-xs font-medium text-zinc-700 block mb-1"
              >
                叙事视点
              </label>
              <input
                id="narrative-pov"
                list="narrative-pov-options"
                value={formData.narrativePov || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    narrativePov: e.target.value,
                  }))
                }
                placeholder="请选择或输入"
                className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              />
              <datalist id="narrative-pov-options">
                <option value="客观视点" />
                <option value="主观视点" />
                <option value="半主观视点" />
                <option value="全知视点" />
                <option value="直接视点" />
              </datalist>
            </div>
            <div>
              <label
                htmlFor="framing"
                className="text-xs font-medium text-zinc-700 block mb-1"
              >
                景别
              </label>
              <input
                id="framing"
                list="framing-options"
                value={formData.framing || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, framing: e.target.value }))
                }
                placeholder="请选择或输入"
                className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              />
              <datalist id="framing-options">
                <option value="全景" />
                <option value="中景" />
                <option value="近景" />
                <option value="特写" />
                <option value="过肩" />
              </datalist>
            </div>
            <div>
              <label
                htmlFor="camera-movement"
                className="text-xs font-medium text-zinc-700 block mb-1"
              >
                运镜方式
              </label>
              <input
                id="camera-movement"
                list="camera-movement-options"
                value={formData.cameraMovement || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cameraMovement: e.target.value,
                  }))
                }
                placeholder="请选择或输入"
                className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              />
              <datalist id="camera-movement-options">
                <option value="固定" />
                <option value="推" />
                <option value="拉" />
                <option value="左摇" />
                <option value="右摇" />
                <option value="上摇" />
                <option value="下摇" />
                <option value="左移" />
                <option value="右移" />
                <option value="上升" />
                <option value="下降" />
                <option value="前跟" />
                <option value="后跟" />
                <option value="左环绕" />
                <option value="右环绕" />
                <option value="手持" />
              </datalist>
            </div>
          </div>

          <div>
            <label
              htmlFor="content"
              className="text-xs font-medium text-zinc-700 block mb-1"
            >
              画面内容描述
            </label>
            <textarea
              id="content"
              value={formData.content || ""}
              onChange={(e) => handleChange("content", e.target.value)}
              rows={3}
              className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            />
          </div>

          <div>
            <label
              htmlFor="action-emotion"
              className="text-xs font-medium text-zinc-700 block mb-1"
            >
              动作与情绪描述
            </label>
            <textarea
              id="action-emotion"
              value={formData.actionEmotion || ""}
              onChange={(e) => handleChange("actionEmotion", e.target.value)}
              rows={2}
              className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            />
          </div>

          <div>
            <label
              htmlFor="dialogue-sound"
              className="text-xs font-medium text-zinc-700 block mb-1"
            >
              对白或音效
            </label>
            <textarea
              id="dialogue-sound"
              value={formData.dialogueSound || ""}
              onChange={(e) => handleChange("dialogueSound", e.target.value)}
              rows={2}
              className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="text-xs font-medium text-zinc-700 block mb-1"
            >
              拍摄备注
            </label>
            <textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
              className="w-full text-sm border border-zinc-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t bg-zinc-50 flex justify-end gap-2">
          {errors._form && (
            <p className="text-sm text-red-500 mr-auto flex items-center">
              {errors._form}
            </p>
          )}
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              "保存中..."
            ) : (
              <>
                <Save size={14} className="mr-1.5" />{" "}
                {isNew ? "创建" : "保存更改"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
