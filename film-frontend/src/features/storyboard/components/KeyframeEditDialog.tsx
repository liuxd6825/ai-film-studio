import { useState } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { useStoryboardStore } from "../store";
import { Button } from "./ui";
import { AIGenerateModal } from "./AIGenerateModal";
import { CameraShotType, CameraAngle, CameraMovement } from "../types";

interface KeyframeEditDialogProps {
  onClose: () => void;
}

export function KeyframeEditDialog({ onClose }: KeyframeEditDialogProps) {
  const {
    editingKeyframeDraft,
    updateEditingKeyframeDraft,
    commitKeyframeEdit,
    cancelKeyframeEdit,
    setActivePromptId,
  } = useStoryboardStore();

  const [showAIGenerate, setShowAIGenerate] = useState(false);

  if (!editingKeyframeDraft) return null;

  const handleClose = () => {
    cancelKeyframeEdit();
    onClose();
  };

  const handleSave = () => {
    commitKeyframeEdit();
    onClose();
  };

  const handleOpenAIGenerate = () => {
    if (editingKeyframeDraft.promptId) {
      setActivePromptId(editingKeyframeDraft.promptId);
    } else {
      setActivePromptId("prompt-new-" + Date.now());
    }
    setShowAIGenerate(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 shrink-0">
            <h2 className="text-lg font-semibold text-zinc-900">编辑关键帧</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
              onClick={handleClose}
            >
              <X size={16} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
            <div className="relative aspect-video bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200">
              <img
                src={
                  editingKeyframeDraft.thumbnailUrl ||
                  editingKeyframeDraft.imageUrl
                }
                alt="Keyframe preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-[10px] bg-blue-500 hover:bg-blue-600 text-white border-0"
                  onClick={handleOpenAIGenerate}
                >
                  <ImageIcon size={12} className="mr-1" />
                  生图
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-[10px] bg-white/90 hover:bg-white text-zinc-900 border-0"
                >
                  上传
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 w-16">帧号:</span>
                <span className="text-sm font-medium text-zinc-900">
                  F
                  {editingKeyframeDraft.frameNumber.toString().padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 w-16">时长:</span>
                <input
                  type="text"
                  className="w-20 px-2 py-1 text-sm border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={parseInt(editingKeyframeDraft.duration) || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    updateEditingKeyframeDraft({
                      duration: val ? `${val}s` : "",
                    });
                  }}
                />
                <span className="text-sm text-zinc-500">s</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">机位</label>
                <select
                  className="w-full px-2 py-1.5 text-sm border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingKeyframeDraft.cameraShotType}
                  onChange={(e) =>
                    updateEditingKeyframeDraft({
                      cameraShotType: e.target.value as CameraShotType,
                    })
                  }
                >
                  {Object.values(CameraShotType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">角度</label>
                <select
                  className="w-full px-2 py-1.5 text-sm border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingKeyframeDraft.cameraAngle}
                  onChange={(e) =>
                    updateEditingKeyframeDraft({
                      cameraAngle: e.target.value as CameraAngle,
                    })
                  }
                >
                  {Object.values(CameraAngle).map((angle) => (
                    <option key={angle} value={angle}>
                      {angle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">运动</label>
                <select
                  className="w-full px-2 py-1.5 text-sm border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingKeyframeDraft.cameraMovement}
                  onChange={(e) =>
                    updateEditingKeyframeDraft({
                      cameraMovement: e.target.value as CameraMovement,
                    })
                  }
                >
                  {Object.values(CameraMovement).map((movement) => (
                    <option key={movement} value={movement}>
                      {movement}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">
                动作说明
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                value={editingKeyframeDraft.actionDescription}
                onChange={(e) =>
                  updateEditingKeyframeDraft({
                    actionDescription: e.target.value,
                  })
                }
                placeholder="描述角色动作..."
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">
                图片提示词
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                value={editingKeyframeDraft.imagePrompt || ""}
                onChange={(e) =>
                  updateEditingKeyframeDraft({ imagePrompt: e.target.value })
                }
                placeholder="AI生图的提示词..."
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">
                画面描述
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                value={editingKeyframeDraft.description}
                onChange={(e) =>
                  updateEditingKeyframeDraft({ description: e.target.value })
                }
                placeholder="描述画面内容..."
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">音效</label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                value={editingKeyframeDraft.soundEffects}
                onChange={(e) =>
                  updateEditingKeyframeDraft({ soundEffects: e.target.value })
                }
                placeholder="描述音效..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-zinc-100 shrink-0">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </div>

      {showAIGenerate && (
        <AIGenerateModal
          onClose={() => setShowAIGenerate(false)}
          onSelectImage={(url) => {
            updateEditingKeyframeDraft({ imageUrl: url, thumbnailUrl: url });
          }}
        />
      )}
    </>
  );
}
