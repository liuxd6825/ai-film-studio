import { useState, useRef, DragEvent, useCallback } from "react";
import { TreeNode as TreeNodeType } from "./types";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder as FolderIcon,
  Plus,
  Trash2,
  Upload,
  Pencil,
} from "lucide-react";

interface FileTreeProps {
  nodes: TreeNodeType[];
  selectedId: string | null;
  onSelect: (node: TreeNodeType) => void;
  onCreateFolder: (parentId: string | null) => void;
  onCreateFile: (parentId: string | null) => void;
  onDelete: (id: string, type: "folder" | "file") => void;
  onRename: (id: string, type: "folder" | "file", currentName: string) => void;
  onUpload: (files: File[]) => void;
  onMove: (
    id: string,
    type: "folder" | "file",
    name: string,
    newParentId: string,
  ) => Promise<void>;
}

export function FileTree({
  nodes,
  selectedId,
  onSelect,
  onCreateFolder,
  onCreateFile,
  onDelete,
  onRename,
  onUpload,
  onMove,
}: FileTreeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isValidDropTarget, setIsValidDropTarget] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAllDescendantIds = useCallback(
    (nodeId: string): string[] => {
      const ids: string[] = [nodeId];
      const findNode = (nodes: TreeNodeType[]): TreeNodeType | null => {
        for (const n of nodes) {
          if (n.id === nodeId) return n;
          const found = findNode(n.children);
          if (found) return found;
        }
        return null;
      };
      const node = findNode(nodes);
      if (node) {
        for (const child of node.children) {
          ids.push(...getAllDescendantIds(child.id));
        }
      }
      return ids;
    },
    [nodes],
  );

  const isValidDrop = useCallback(
    (targetId: string): boolean => {
      for (const id of draggedIds) {
        if (id === targetId) return false;
        const descendantIds = getAllDescendantIds(id);
        if (descendantIds.includes(targetId)) return false;
      }
      return true;
    },
    [draggedIds, getAllDescendantIds],
  );

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      e.stopPropagation();
      setIsDragging(true);
    }
  };

  const handleNodeDragOver = (e: DragEvent, targetNode: TreeNodeType) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIds.length > 0) {
      setDragOverId(targetNode.id);
      setIsValidDropTarget(isValidDrop(targetNode.id));
    }
  };

  const handleNodeDrop = async (e: DragEvent, targetNode: TreeNodeType) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIds.length === 0 || targetNode.type !== "folder") {
      setDragOverId(null);
      setDraggedIds([]);
      setSelectedIds(new Set());
      return;
    }

    if (!isValidDrop(targetNode.id)) {
      setDragOverId(null);
      setDraggedIds([]);
      setSelectedIds(new Set());
      alert("无法将文件夹移动到其子文件夹中");
      return;
    }

    try {
      for (const id of draggedIds) {
        const node = findNodeById(nodes, id);
        if (node) {
          await onMove(id, node.type, node.name, targetNode.id);
        }
      }
    } catch (err) {
      console.error("Failed to move:", err);
    }

    setExpandedIds((prev) => new Set([...prev, targetNode.id]));
    setDragOverId(null);
    setDraggedIds([]);
    setSelectedIds(new Set());
  };

  const handleToggleExpand = (nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      e.stopPropagation();
      setIsDragging(false);
      setDragOverId(null);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      e.stopPropagation();
      setIsDragging(false);
      setDragOverId(null);
      onUpload(files);
      setDraggedIds([]);
    }
  };

  const handleNodeDragStart = (e: DragEvent, node: TreeNodeType) => {
    e.stopPropagation();
    setDraggedIds([node.id]);
  };

  const handleNodeDragEnd = () => {
    setDraggedIds([]);
    setDragOverId(null);
    setSelectedIds(new Set());
  };

  const handleNodeClick = (e: React.MouseEvent, node: TreeNodeType) => {
    if (e.shiftKey && selectedIds.size > 0) {
      const lastSelected = Array.from(selectedIds).pop()!;
      const range = getNodesInRange(lastSelected, node.id);
      setSelectedIds(new Set([...selectedIds, ...range]));
    } else if (e.ctrlKey || e.metaKey) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(node.id)) {
        newSelected.delete(node.id);
      } else {
        newSelected.add(node.id);
      }
      setSelectedIds(newSelected);
    } else {
      setSelectedIds(new Set([node.id]));
    }
    onSelect(node);
  };

  const getNodesInRange = (fromId: string, toId: string): string[] => {
    const flatNodes: string[] = [];
    const flatten = (nodes: TreeNodeType[]) => {
      for (const n of nodes) {
        flatNodes.push(n.id);
        flatten(n.children);
      }
    };
    flatten(nodes);

    const fromIndex = flatNodes.indexOf(fromId);
    const toIndex = flatNodes.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) return [toId];
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    return flatNodes.slice(start, end + 1);
  };

  const findNodeById = (
    nodes: TreeNodeType[],
    id: string,
  ): TreeNodeType | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files);
    }
    e.target.value = "";
  };

  return (
    <div
      className={`py-2 h-full flex flex-col ${isDragging ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="px-3 mb-2 flex gap-2">
        <button
          onClick={() => onCreateFolder(null)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
        >
          <FolderIcon size={14} />
          新建目录
        </button>
        <button
          onClick={() => onCreateFile(null)}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors border border-green-200 dark:border-green-800"
        >
          <FileText size={14} />
          新建文档
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors border border-purple-200 dark:border-purple-800"
        >
          <Upload size={14} />
          上传
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      <div
        className={`flex-1 overflow-y-auto ${isDragging ? "bg-blue-50/50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg m-2" : ""}`}
      >
        {isDragging && (
          <div className="h-full flex items-center justify-center text-blue-500 dark:text-blue-400 text-sm">
            拖放文件到此处上传
          </div>
        )}
        {!isDragging && (
          <div className="space-y-0.5">
            {nodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                selectedId={selectedId}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                draggedIds={draggedIds}
                dragOverId={dragOverId}
                isValidDropTarget={isValidDropTarget}
                onSelect={onSelect}
                onNodeClick={handleNodeClick}
                onToggleExpand={handleToggleExpand}
                onCreateFolder={onCreateFolder}
                onCreateFile={onCreateFile}
                onDelete={onDelete}
                onRename={onRename}
                onMove={onMove}
                onNodeDragStart={handleNodeDragStart}
                onNodeDragOver={handleNodeDragOver}
                onNodeDrop={handleNodeDrop}
                onNodeDragEnd={handleNodeDragEnd}
                level={0}
              />
            ))}
          </div>
        )}
      </div>
      {nodes.length === 0 && !isDragging && (
        <div className="px-3 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
          暂无内容
        </div>
      )}
    </div>
  );
}

interface TreeNodeProps {
  node: TreeNodeType;
  selectedId: string | null;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  draggedIds: string[];
  dragOverId: string | null;
  isValidDropTarget: boolean;
  onSelect: (node: TreeNodeType) => void;
  onNodeClick: (e: React.MouseEvent, node: TreeNodeType) => void;
  onToggleExpand: (nodeId: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onCreateFile: (parentId: string | null) => void;
  onDelete: (id: string, type: "folder" | "file") => void;
  onRename: (id: string, type: "folder" | "file", currentName: string) => void;
  onMove: (
    id: string,
    type: "folder" | "file",
    name: string,
    newParentId: string,
  ) => Promise<void>;
  onNodeDragStart: (e: DragEvent, node: TreeNodeType) => void;
  onNodeDragOver: (e: DragEvent, node: TreeNodeType) => void;
  onNodeDrop: (e: DragEvent, node: TreeNodeType) => void;
  onNodeDragEnd: () => void;
  level: number;
}

function TreeNode({
  node,
  selectedId,
  selectedIds,
  expandedIds,
  draggedIds,
  dragOverId,
  isValidDropTarget,
  onSelect,
  onNodeClick,
  onToggleExpand,
  onCreateFolder,
  onCreateFile,
  onDelete,
  onRename,
  onMove,
  onNodeDragStart,
  onNodeDragOver,
  onNodeDrop,
  onNodeDragEnd,
  level,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isDragged = draggedIds.includes(node.id);
  const isDragOver = dragOverId === node.id;
  const isMultiSelected = selectedIds.has(node.id);

  const dropTargetClass = isDragOver
    ? isValidDropTarget
      ? "border-2 border-dashed border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30"
      : "border-2 border-dashed border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/30"
    : "";

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-3 py-1.5 cursor-pointer transition-colors ${dropTargetClass} ${
          isSelected
            ? node.type === "folder"
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              : "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            : isMultiSelected
              ? "bg-blue-100 dark:bg-blue-900/40"
              : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
        } ${isDragged ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        draggable={true}
        onClick={(e) => onNodeClick(e, node)}
        onDragStart={(e) => onNodeDragStart(e, node)}
        onDragOver={(e) => onNodeDragOver(e, node)}
        onDrop={(e) => onNodeDrop(e, node)}
        onDragEnd={onNodeDragEnd}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        {node.type === "folder" ? (
          <FolderIcon size={14} className="text-yellow-500 dark:text-yellow-400" />
        ) : (
          <FileText size={14} className="text-gray-400 dark:text-gray-500" />
        )}
        <span className="flex-1 text-sm truncate text-gray-900 dark:text-gray-100">{node.name}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.type === "folder" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFile(node.id);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                title="新建文档"
              >
                <Plus size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(node.id, "folder", node.name);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                title="重命名"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node.id, "folder");
                }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                title="删除"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
          {node.type === "file" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(node.id, "file", node.name);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                title="重命名"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node.id, "file");
                }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                title="删除"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              draggedIds={draggedIds}
              dragOverId={dragOverId}
              isValidDropTarget={isValidDropTarget}
              onSelect={onSelect}
              onNodeClick={onNodeClick}
              onToggleExpand={onToggleExpand}
              onCreateFolder={onCreateFolder}
              onCreateFile={onCreateFile}
              onDelete={onDelete}
              onRename={onRename}
              onMove={onMove}
              onNodeDragStart={onNodeDragStart}
              onNodeDragOver={onNodeDragOver}
              onNodeDrop={onNodeDrop}
              onNodeDragEnd={onNodeDragEnd}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
