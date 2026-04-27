import { useState } from "react";
import { X, Sparkles, Loader2, Check, AlertCircle } from "lucide-react";
import { Button, Badge } from "./ui";
import { storyboardApi } from "../api";
import { ShotItem, Shot } from "../types";

interface BatchGenerateModalProps {
  storyPageId: string;
  projectId: string;
  onClose: () => void;
  onSaved: (shots: Shot[]) => void;
}

export function BatchGenerateModal({
  storyPageId,
  projectId,
  onClose,
  onSaved,
}: BatchGenerateModalProps) {
  const [loading, setLoading] = useState(false);
  const [shotSuggestions, setShotSuggestions] = useState<ShotItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptInput, setScriptInput] = useState("");

  const handleAnalyze = async () => {
    if (!scriptInput.trim()) {
      setError("请输入剧本内容");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await storyboardApi.generateFromScript({
        agentId: "",
        projectId,
        scriptSegment: scriptInput,
      });
      setShotSuggestions(result.storyboard);
    } catch (err) {
      setError("分析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const savedShots = await storyboardApi.createShotsBatch(
        projectId,
        storyPageId,
        shotSuggestions.map((item) => ({
          content: item.content,
          duration: item.duration,
          sceneType: item.sceneType,
          timeFrame: item.timeFrame,
          weather: item.weather,
          lighting: item.lighting,
          cameraMovement: item.cameraMovement,
          framing: item.framing,
          actionEmotion: item.actionEmotion,
          dialogueSound: item.dialogueSound,
          notes: item.notes,
        })),
      );
      onSaved(savedShots);
    } catch (err) {
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-zinc-900">
              批量生成镜头
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!shotSuggestions.length && !loading && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  输入剧本内容
                </label>
                <textarea
                  className="w-full h-64 p-3 border border-zinc-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-zinc-700"
                  placeholder="请在此粘贴或输入剧本内容，AI 将根据内容分析并生成镜头建议..."
                  value={scriptInput}
                  onChange={(e) => setScriptInput(e.target.value)}
                />
                <p className="mt-2 text-xs text-zinc-400">
                  提示：输入的剧本内容将用于 AI
                  分析，建议包含场景描述、角色动作、对白等信息
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 size={48} className="mb-4 text-blue-500 animate-spin" />
              <p className="text-lg text-zinc-600">AI 分析中...</p>
            </div>
          )}

          {shotSuggestions.length > 0 && !saving && (
            <div className="space-y-4">
              {shotSuggestions.map((shot, idx) => (
                <div
                  key={shot.shotId || idx}
                  className="border border-zinc-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-zinc-900">
                      {shot.shotType || "镜头"} {shot.shotId}
                    </h3>
                    <Badge variant="secondary">{shot.duration}秒</Badge>
                  </div>
                  <p className="text-sm text-zinc-600 mb-2">{shot.content}</p>
                  <p className="text-xs text-zinc-400">
                    {shot.sceneType} | {shot.timeFrame} | {shot.weather}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {shot.cameraMovement} | {shot.framing} | {shot.lighting}
                  </p>
                  {shot.notes && (
                    <p className="text-xs text-zinc-500 mt-2 italic">
                      备注: {shot.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {saving && (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 size={48} className="mb-4 text-green-500 animate-spin" />
              <p className="text-lg text-zinc-600">保存中...</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          {!shotSuggestions.length ? (
            <Button onClick={handleAnalyze} disabled={loading}>
              <Sparkles size={16} className="mr-2" />
              {loading ? "分析中..." : "开始分析"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleAnalyze}
                disabled={saving}
              >
                重新分析
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  取消
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Check size={16} className="mr-2" />
                  {saving ? "保存中..." : "确认保存"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
