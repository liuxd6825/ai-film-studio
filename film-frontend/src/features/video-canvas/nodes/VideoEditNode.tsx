import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface VideoEditNodeData {
  inputVideoUrl: string | null;
  outputVideoUrl?: string | null;
  prompt?: string;
  model?: string;
  isGenerating?: boolean;
  generationJobId?: string;
}

export const VideoEditNode = memo(function VideoEditNode({
  data,
  selected,
}: NodeProps & { data: VideoEditNodeData }) {
  const { inputVideoUrl, prompt, model, isGenerating } = data;

  return (
    <div
      className={`min-w-[240px] bg-white rounded-lg border-2 ${
        selected ? "border-blue-500" : "border-gray-200"
      } shadow-md`}
    >
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <span className="text-sm font-medium text-gray-700">Video Edit</span>
      </div>
      <div className="p-3 space-y-3">
        {inputVideoUrl ? (
          <video
            src={inputVideoUrl}
            className="w-full h-24 object-cover rounded"
            controls
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded p-2 text-center text-xs text-gray-500">
            No input video
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-gray-500">Prompt</label>
          <input
            type="text"
            value={prompt || ""}
            placeholder="Edit instruction..."
            className="w-full px-2 py-1 text-sm border rounded"
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-500">Model</label>
          <select
            value={model || "comfyui"}
            className="w-full px-2 py-1 text-sm border rounded"
            disabled={isGenerating}
          >
            <option value="comfyui">ComfyUI (SVD)</option>
            <option value="google-veo">Google Veo</option>
          </select>
        </div>

        {isGenerating && (
          <div className="text-xs text-blue-500 text-center">Generating...</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});
