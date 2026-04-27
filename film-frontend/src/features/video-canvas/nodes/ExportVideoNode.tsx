import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ExportVideoNodeData {
  inputVideoUrl?: string | null;
  format?: "mp4" | "webm" | "gif";
  quality?: "low" | "medium" | "high";
  outputUrl?: string | null;
  isExporting?: boolean;
}

export const ExportVideoNode = memo(function ExportVideoNode({
  data,
  selected,
}: NodeProps & { data: ExportVideoNodeData }) {
  const {
    inputVideoUrl,
    format = "mp4",
    quality = "high",
    outputUrl,
    isExporting,
  } = data;

  return (
    <div
      className={`min-w-[200px] bg-white rounded-lg border-2 ${
        selected ? "border-blue-500" : "border-gray-200"
      } shadow-md`}
    >
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <span className="text-sm font-medium text-gray-700">Export Video</span>
      </div>
      <div className="p-3 space-y-3">
        {inputVideoUrl || outputUrl ? (
          <video
            src={outputUrl ?? inputVideoUrl ?? undefined}
            className="w-full h-28 object-cover rounded"
            controls
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center">
            <div className="text-xs text-gray-500">No video to export</div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-gray-500">Format</label>
            <select
              value={format}
              className="w-full px-2 py-1 text-sm border rounded"
              disabled={isExporting}
            >
              <option value="mp4">MP4</option>
              <option value="webm">WebM</option>
              <option value="gif">GIF</option>
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs text-gray-500">Quality</label>
            <select
              value={quality}
              className="w-full px-2 py-1 text-sm border rounded"
              disabled={isExporting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {isExporting && (
          <div className="text-xs text-blue-500 text-center">Exporting...</div>
        )}

        {outputUrl && !isExporting && (
          <div className="text-xs text-green-500 text-center">Export ready</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
    </div>
  );
});
