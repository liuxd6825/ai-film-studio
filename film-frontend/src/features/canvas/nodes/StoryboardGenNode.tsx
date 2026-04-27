import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import {
  StoryboardGenNodeData,
  type StoryboardGenFrameItem,
} from "../domain/canvasNodes";
import { useCanvasStore } from "../stores/canvasStore";
import { v4 as uuidv4 } from "uuid";
import { NodeToolbar } from "../ui/NodeToolbar";

interface StoryboardGenNodeDataExt extends StoryboardGenNodeData {}

export const StoryboardGenNode = memo(function StoryboardGenNode({
  id,
  data,
  selected,
}: NodeProps & { data: StoryboardGenNodeDataExt }) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const addStoryboardSplitNode = useCanvasStore(
    (s) => s.addStoryboardSplitNode,
  );
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    if (!data.frames || data.frames.length === 0) {
      setError("请先输入分镜描述");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const frames = data.frames.map((frame, index) => ({
        id: uuidv4(),
        description: frame.description,
        order: index,
      }));

      const storyboardFrames = frames.map((frame) => ({
        id: uuidv4(),
        imageUrl: null,
        previewImageUrl: null,
        note: frame.description || `分镜 ${frame.order + 1}`,
        order: frame.order,
      }));

      addStoryboardSplitNode(
        id,
        data.gridRows || 2,
        data.gridCols || 2,
        storyboardFrames,
        "16:9",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成分镜失败");
    } finally {
      setIsGenerating(false);
    }
  }, [data.frames, data.gridRows, data.gridCols, id, addStoryboardSplitNode]);

  const handleFrameDescriptionChange = useCallback(
    (index: number, description: string) => {
      const newFrames = [...(data.frames || [])];
      newFrames[index] = {
        ...newFrames[index],
        description,
      };
      updateNodeData(id, { frames: newFrames });
    },
    [data.frames, id, updateNodeData],
  );

  const handleAddFrame = useCallback(() => {
    const newFrame: StoryboardGenFrameItem = {
      id: uuidv4(),
      description: "",
      referenceIndex: null,
    };
    updateNodeData(id, {
      frames: [...(data.frames || []), newFrame],
    });
  }, [data.frames, id, updateNodeData]);

  const handleRemoveFrame = useCallback(
    (index: number) => {
      const newFrames = (data.frames || []).filter((_, i) => i !== index);
      updateNodeData(id, { frames: newFrames });
    },
    [data.frames, id, updateNodeData],
  );

  const handleDelete = useCallback(() => {
    deleteNode(id);
  }, [id, deleteNode]);

  return (
    <>
      <NodeToolbar nodeId={id} visible={selected}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          title="删除"
        >
          <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
        </button>
      </NodeToolbar>
      <div
        className={`min-w-[400px] bg-white dark:bg-gray-800 rounded-lg border-2 ${
          selected ? "border-blue-500" : "border-gray-200 dark:border-gray-700"
        } shadow-md`}
      >
      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
          {data.displayName || "故事板生成"}
        </span>
        {isGenerating && (
          <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse">
            生成分镜中...
          </span>
        )}
      </div>

      <div className="p-3 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">行数</label>
            <input
              type="number"
              min={1}
              max={6}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={data.gridRows || 2}
              onChange={(e) =>
                updateNodeData(id, { gridRows: parseInt(e.target.value) || 2 })
              }
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">列数</label>
            <input
              type="number"
              min={1}
              max={6}
              className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={data.gridCols || 2}
              onChange={(e) =>
                updateNodeData(id, { gridCols: parseInt(e.target.value) || 2 })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-500 dark:text-gray-400 block">分镜描述</label>
          {(data.frames || []).map((frame, index) => (
            <div key={frame.id || index} className="flex gap-2 items-start">
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 w-6">
                {index + 1}.
              </span>
              <textarea
                className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded p-2 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder={`分镜 ${index + 1} 描述...`}
                rows={2}
                value={frame.description || ""}
                onChange={(e) =>
                  handleFrameDescriptionChange(index, e.target.value)
                }
              />
              <button
                className="mt-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                onClick={() => handleRemoveFrame(index)}
                title="删除分镜"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
          <button
            className="w-full text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={handleAddFrame}
          >
            + 添加分镜
          </button>
        </div>

        {error && (
          <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        <button
          className={`w-full py-2 rounded text-sm font-medium transition-colors ${
            isGenerating
              ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700"
          }`}
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? "生成分镜中..." : "生成分镜"}
        </button>
      </div>

      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
    </>
  );
});
