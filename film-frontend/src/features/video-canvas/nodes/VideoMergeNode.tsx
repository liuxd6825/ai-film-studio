import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface VideoMergeNodeData {
  inputVideoUrls: string[];
  outputVideoUrl?: string | null;
  transition?: "cut" | "fade" | "dissolve";
  isMerging?: boolean;
}

export const VideoMergeNode = memo(function VideoMergeNode({
  data,
  selected,
}: NodeProps & { data: VideoMergeNodeData }) {
  const { inputVideoUrls = [], transition = "cut", isMerging } = data;

  return (
    <div
      className={`min-w-[240px] bg-white rounded-lg border-2 ${
        selected ? "border-blue-500" : "border-gray-200"
      } shadow-md`}
    >
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <span className="text-sm font-medium text-gray-700">Video Merge</span>
      </div>
      <div className="p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Input Videos</label>
          <div className="flex gap-1 flex-wrap">
            {inputVideoUrls.length > 0 ? (
              inputVideoUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="w-12 h-12 rounded border overflow-hidden"
                >
                  {url && (
                    <video src={url} className="w-full h-full object-cover" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400">No inputs</div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-500">Transition</label>
          <select
            value={transition}
            className="w-full px-2 py-1 text-sm border rounded"
            disabled={isMerging}
          >
            <option value="cut">Cut</option>
            <option value="fade">Fade</option>
            <option value="dissolve">Dissolve</option>
          </select>
        </div>

        {isMerging && (
          <div className="text-xs text-blue-500 text-center">Merging...</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});
