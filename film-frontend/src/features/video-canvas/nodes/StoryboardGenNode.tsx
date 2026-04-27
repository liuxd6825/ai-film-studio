import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface StoryboardFrame {
  id: string;
  description: string;
  imageUrl: string | null;
  order: number;
  duration?: number;
}

interface StoryboardGenNodeData {
  prompt?: string;
  gridRows: number;
  gridCols: number;
  frames: StoryboardFrame[];
  model?: string;
  aspectRatio: string;
  isGenerating?: boolean;
}

export const StoryboardGenNode = memo(function StoryboardGenNode({
  data,
  selected,
}: NodeProps & { data: StoryboardGenNodeData }) {
  const {
    prompt,
    gridRows = 2,
    gridCols = 2,
    frames = [],
    model = "google-veo",
    isGenerating,
  } = data;

  return (
    <div
      className={`min-w-[280px] bg-white rounded-lg border-2 ${
        selected ? "border-blue-500" : "border-gray-200"
      } shadow-md`}
    >
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <span className="text-sm font-medium text-gray-700">
          Storyboard Gen
        </span>
      </div>
      <div className="p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Prompt</label>
          <textarea
            value={prompt || ""}
            placeholder="Describe the storyboard..."
            className="w-full px-2 py-1 text-sm border rounded resize-none"
            rows={2}
            disabled={isGenerating}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-gray-500">Rows</label>
            <input
              type="number"
              value={gridRows}
              min={1}
              max={6}
              className="w-full px-2 py-1 text-sm border rounded"
              disabled={isGenerating}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs text-gray-500">Cols</label>
            <input
              type="number"
              value={gridCols}
              min={1}
              max={6}
              className="w-full px-2 py-1 text-sm border rounded"
              disabled={isGenerating}
            />
          </div>
        </div>

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

        {isGenerating ? (
          <div className="text-xs text-blue-500 text-center py-2">
            Generating storyboard...
          </div>
        ) : frames.length > 0 ? (
          <div
            className="grid gap-1"
            style={{
              gridTemplateRows: `repeat(${gridRows}, 1fr)`,
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            }}
          >
            {frames.slice(0, gridRows * gridCols).map((frame) => (
              <div
                key={frame.id}
                className="aspect-video bg-gray-100 rounded overflow-hidden"
              >
                {frame.imageUrl && (
                  <img
                    src={frame.imageUrl}
                    alt={frame.description || `Frame ${frame.order}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-2">
            Click to generate storyboard
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});
