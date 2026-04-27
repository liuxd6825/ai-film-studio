import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface StoryboardToVideoNodeData {
  inputStoryboardUrl?: string | null;
  frames: Array<{
    id: string;
    imageUrl: string | null;
    description?: string;
    duration?: number;
  }>;
  model?: "comfyui-svd" | "google-veo";
  outputVideoUrl?: string | null;
  isGenerating?: boolean;
  generationJobId?: string;
}

export const StoryboardToVideoNode = memo(function StoryboardToVideoNode({
  data,
  selected,
}: NodeProps & { data: StoryboardToVideoNodeData }) {
  const {
    inputStoryboardUrl,
    frames = [],
    model = "google-veo",
    outputVideoUrl,
    isGenerating,
  } = data;

  return (
    <div
      className={`min-w-[240px] bg-white rounded-lg border-2 ${
        selected ? "border-blue-500" : "border-gray-200"
      } shadow-md`}
    >
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <span className="text-sm font-medium text-gray-700">
          Storyboard to Video
        </span>
      </div>
      <div className="p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Model</label>
          <select
            value={model}
            className="w-full px-2 py-1 text-sm border rounded"
            disabled={isGenerating}
          >
            <option value="google-veo">Google Veo</option>
            <option value="comfyui-svd">ComfyUI SVD</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-500">Frames</label>
          <div className="flex gap-1 flex-wrap">
            {frames.length > 0 ? (
              frames.slice(0, 4).map((frame, idx) => (
                <div
                  key={frame.id || idx}
                  className="w-10 h-10 rounded border overflow-hidden bg-gray-50"
                >
                  {frame.imageUrl && (
                    <img
                      src={frame.imageUrl}
                      alt={`Frame ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))
            ) : inputStoryboardUrl ? (
              <div className="w-10 h-10 rounded border overflow-hidden">
                <img
                  src={inputStoryboardUrl}
                  alt="Storyboard"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="text-xs text-gray-400">No frames</div>
            )}
            {frames.length > 4 && (
              <div className="w-10 h-10 rounded border bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                +{frames.length - 4}
              </div>
            )}
          </div>
        </div>

        {outputVideoUrl && (
          <video
            src={outputVideoUrl}
            className="w-full h-24 object-cover rounded"
            controls
          />
        )}

        {isGenerating && (
          <div className="text-xs text-blue-500 text-center py-2">
            Generating video...
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});
