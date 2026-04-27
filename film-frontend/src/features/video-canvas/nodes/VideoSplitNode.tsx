import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface FrameItem {
  id: string;
  imageUrl: string | null;
  index: number;
  timestamp: number;
  note?: string;
}

interface VideoSplitNodeData {
  inputVideoUrl: string | null;
  frames: FrameItem[];
  gridRows: number;
  gridCols: number;
}

export const VideoSplitNode = memo(function VideoSplitNode({
  data,
  selected,
}: NodeProps & { data: VideoSplitNodeData }) {
  const { inputVideoUrl, frames, gridRows = 2, gridCols = 2 } = data;

  return (
    <div
      className={`min-w-[240px] bg-white rounded-lg border-2 ${
        selected ? "border-blue-500" : "border-gray-200"
      } shadow-md`}
    >
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <span className="text-sm font-medium text-gray-700">Video Split</span>
      </div>
      <div className="p-3 space-y-2">
        {inputVideoUrl ? (
          <video
            src={inputVideoUrl}
            className="w-full h-20 object-cover rounded"
            controls
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded p-2 text-center text-xs text-gray-500">
            No input video
          </div>
        )}

        <div className="text-xs text-gray-500">
          Grid: {gridRows} x {gridCols}
        </div>

        {frames.length > 0 ? (
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
                    alt={`Frame ${frame.index}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center">
            Split frames will appear here
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});
