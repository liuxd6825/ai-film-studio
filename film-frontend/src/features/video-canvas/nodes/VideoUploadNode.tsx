import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface VideoUploadNodeData {
  videoUrl: string | null;
  fileName?: string;
  duration?: number;
  aspectRatio: string;
}

export const VideoUploadNode = memo(function VideoUploadNode({
  data,
  selected,
}: NodeProps & { data: VideoUploadNodeData }) {
  const { videoUrl, fileName, duration } = data;

  return (
    <div
      className={`min-w-[200px] bg-white rounded-lg border-2 ${
        selected ? "border-blue-500" : "border-gray-200"
      } shadow-md`}
    >
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <span className="text-sm font-medium text-gray-700">Video Upload</span>
      </div>
      <div className="p-3">
        {videoUrl ? (
          <div className="space-y-2">
            <video
              src={videoUrl}
              className="w-full h-32 object-cover rounded"
              controls
            />
            <div className="text-xs text-gray-500">
              <p className="truncate">{fileName || "video.mp4"}</p>
              {duration && <p>Duration: {duration}s</p>}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Click to upload video</p>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
});
