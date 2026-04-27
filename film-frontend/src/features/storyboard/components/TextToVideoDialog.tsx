import { useState, useEffect } from 'react';
import { X, Clapperboard, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { Shot, Keyframe } from '../types';
import { toast } from 'sonner';

interface TextToVideoDialogProps {
  shot: Shot;
  keyframes: Keyframe[];
  open: boolean;
  onClose: () => void;
}

function buildVideoPrompt(shot: Shot, keyframes: Keyframe[]): string {
  const shotPart = `【镜头 ${shot.orderNum}】
画面：${shot.content || ''}
场景：${shot.sceneType || ''} | 天气：${shot.weather || ''} | 时间：${shot.timeFrame || ''} | 光线：${shot.lighting || ''}
景别：${shot.framing || ''} | 机位：${shot.cameraAngleH || ''}/${shot.cameraAngleV || ''} | 运镜：${shot.cameraMovement || ''}
动作情绪：${shot.actionEmotion || ''}
对白音效：${shot.dialogueSound || ''}`;

  const keyframesPart = keyframes
    .map((kf, idx) => `【关键帧${idx + 1} - 静态词】
${kf.imagePrompt || kf.description || ''}`)
    .join('\n\n');

  return [shotPart, keyframesPart].filter(Boolean).join('\n\n');
}

export function TextToVideoDialog({ shot, keyframes, open, onClose }: TextToVideoDialogProps) {
  const [promptText, setPromptText] = useState(() => buildVideoPrompt(shot, keyframes));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPromptText(buildVideoPrompt(shot, keyframes));
  }, [shot, keyframes]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Clapperboard size={18} className="text-primary" />
            <h2 className="font-semibold">文生视频提示词</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          <textarea
            className="w-full h-full min-h-[300px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="提示词内容..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-t">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleCopy} disabled={copied}>
            {copied ? (
              <>
                <Check size={16} className="mr-1" />
                已复制
              </>
            ) : (
              <>
                <Copy size={16} className="mr-1" />
                复制提示词
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
