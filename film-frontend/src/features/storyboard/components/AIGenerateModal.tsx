import { useState } from "react";
import {
  X,
  MessageSquare,
  User,
  Bot,
  Download,
  Plus,
  Paperclip,
  Image as ImageIcon,
  LayoutGrid,
} from "lucide-react";
import { useStoryboardStore } from "../store";
import { Button, Badge } from "./ui";

interface AIGenerateModalProps {
  onClose: () => void;
  onSelectImage?: (url: string) => void;
}

export function AIGenerateModal({
  onClose,
  onSelectImage,
}: AIGenerateModalProps) {
  const {
    activePromptId,
    setActivePromptId,
    inputMedia,
    setInputMedia,
    savedMedia,
    setSavedMedia,
    updateEditingKeyframeDraft,
  } = useStoryboardStore();

  const [promptInput, setPromptInput] = useState("");

  if (!activePromptId) return null;

  const handleMockUpload = () => {
    const mockUrl = `https://picsum.photos/seed/${Date.now()}/400/300`;
    setInputMedia((prev) => [...prev, mockUrl]);
  };

  const handleSaveToGallery = (url: string) => {
    if (!savedMedia.includes(url)) {
      setSavedMedia((prev) => [...prev, url]);
    }
  };

  const handleSetKeyframeImage = (url: string) => {
    if (updateEditingKeyframeDraft) {
      updateEditingKeyframeDraft({ imageUrl: url, thumbnailUrl: url });
    }
    onSelectImage?.(url);
  };

  const handleSendPrompt = () => {
    if (promptInput.trim()) {
      console.log("Sending prompt:", promptInput);
      setPromptInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-zinc-200 bg-zinc-50/30 min-w-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-zinc-500" />
              <h3 className="font-medium text-zinc-900">
                提示词对话 (Prompt Chat)
              </h3>
              <Badge
                variant="outline"
                className="ml-2 text-[10px] font-normal bg-white"
              >
                ID: {activePromptId}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
              onClick={() => {
                setActivePromptId(null);
                onClose();
              }}
            >
              <X size={16} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
                  <User size={16} className="text-zinc-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">
                      User
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-none p-3 shadow-sm inline-block">
                    <p className="text-sm text-zinc-700 font-mono leading-relaxed">
                      {promptInput || "输入提示词生成图像..."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">
                      AI Generator
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-none p-3 shadow-sm inline-block w-full">
                    <p className="text-sm text-zinc-600 mb-3">
                      {savedMedia.length > 0
                        ? "图库中的图像:"
                        : "暂无生成的图像"}
                    </p>
                    {savedMedia.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {savedMedia.map((url, i) => (
                          <div
                            key={i}
                            className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 shadow-sm group"
                          >
                            <img
                              src={url}
                              alt={`Saved media ${i}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-[10px] bg-white/90 hover:bg-white text-zinc-900 border-0"
                                onClick={() => handleSaveToGallery(url)}
                              >
                                <Download size={12} className="mr-1" />{" "}
                                保存到图库
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-zinc-100 bg-white shrink-0">
            {inputMedia.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {inputMedia.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden border border-zinc-200 group"
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() =>
                        setInputMedia((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-10 w-10 text-zinc-500 rounded-full"
                onClick={handleMockUpload}
                title="上传参考图/视频"
              >
                <Paperclip size={18} />
              </Button>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="调整提示词 (Refine prompt)..."
                  className="w-full pl-4 pr-12 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendPrompt()}
                />
                <Button
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSendPrompt}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 flex flex-col bg-white shrink-0">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between shrink-0">
            <h3 className="font-medium text-zinc-900 flex items-center gap-2">
              <LayoutGrid size={16} className="text-zinc-500" />
              图库 (备选画面)
            </h3>
            <Badge variant="secondary" className="text-[10px] font-normal">
              {savedMedia.length} 张
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {savedMedia.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm">
                <ImageIcon size={32} className="mb-3 opacity-20" />
                <p>暂无备选图片</p>
                <p className="text-xs mt-1 opacity-60">
                  在左侧对话中生成并保存
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {savedMedia.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-md overflow-hidden border border-zinc-200 group shadow-sm"
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                      <Button
                        size="sm"
                        className="w-full h-7 text-[10px] bg-blue-500 hover:bg-blue-600 text-white border-0"
                        onClick={() => handleSetKeyframeImage(url)}
                      >
                        设为关键帧
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full h-7 text-[10px] bg-white/20 hover:bg-white/30 text-white border-0"
                        onClick={() =>
                          setSavedMedia((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        移除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
