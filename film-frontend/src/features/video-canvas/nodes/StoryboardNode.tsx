import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface StoryboardFrame {
  id: string;
  description: string;
  imageUrl: string | null;
  order: number;
  duration?: number;
}

interface StoryboardNodeData {
  frames: StoryboardFrame[];
  displayMode?: "grid" | "sequence";
  gridRows: number;
  gridCols: number;
}

export const StoryboardNode = memo(function StoryboardNode({
  data,
  selected,
}: NodeProps & { data: StoryboardNodeData }) {
  const {
    frames = [],
    displayMode = "grid",
    gridRows = 2,
    gridCols = 2,
  } = data;

  return (
    <div
      className={`min-w-[280px] bg-white rounded-lg border-2 ${
        selected ? "border-blue-500" : "border-gray-200"
      } shadow-md`}
    >
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Storyboard</span>
        <select
          value={displayMode}
          className="px-1 py-0.5 text-xs border rounded"
        >
          <option value="grid">Grid</option>
          <option value="sequence">Sequence</option>
        </select>
      </div>
      <div className="p-3">
        {frames.length > 0 ? (
          displayMode === "grid" ? (
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
                  className="aspect-video bg-gray-100 rounded overflow-hidden relative"
                >
                  {frame.imageUrl && (
                    <img
                      src={frame.imageUrl}
                      alt={frame.description || `Frame ${frame.order}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                    {frame.order + 1}: {frame.description || "..."}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {frames.map((frame) => (
                <div key={frame.id} className="flex gap-2 items-start">
                  <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {frame.imageUrl && (
                      <img
                        src={frame.imageUrl}
                        alt={frame.description || `Frame ${frame.order}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">
                      Frame {frame.order + 1}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {frame.description || "..."}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-xs text-gray-400 text-center py-4">
            Connect from Storyboard Gen or upload frames
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});
