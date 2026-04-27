import { useState, useEffect } from "react";
import { api } from "@/api/client";
import { FileItem, Folder, TreeNode, buildTree } from "./types";
import { FileTree } from "./FileTree";
import { FileEditor } from "./FileEditor";
import { FileText } from "lucide-react";

interface FilePanelProps {
  projectId: string;
}

export function FilePanel({ projectId }: FilePanelProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderModalParentId, setFolderModalParentId] = useState<string | null>(
    null,
  );

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameId, setRenameId] = useState<string>("");
  const [renameType, setRenameType] = useState<"folder" | "file">("file");
  const [renameName, setRenameName] = useState("");
  const [renameModalTitle, setRenameModalTitle] = useState("");

  const fetchData = async () => {
    try {
      const [foldersRes, filesRes] = await Promise.all([
        api.get<Folder[]>(`/api/v1/projects/${projectId}/folders`),
        api.get<FileItem[]>(`/api/v1/projects/${projectId}/files?all=true`),
      ]);
      setFiles(filesRes);
      setTreeData(buildTree(foldersRes, filesRes));
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleSelect = (node: TreeNode) => {
    if (node.type === "file") {
      const file = files.find((f) => f.id === node.id);
      if (file) {
        setSelectedFile(file);
      }
    }
  };

  const handleCreateFolder = async (parentId: string | null) => {
    setFolderModalParentId(parentId);
    setNewFolderName("");
    setShowFolderModal(true);
  };

  const handleFolderSubmit = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.post(`/api/v1/projects/${projectId}/folders`, {
        name: newFolderName.trim(),
        parentId: folderModalParentId,
      });
      setShowFolderModal(false);
      setNewFolderName("");
      await fetchData();
    } catch (e) {
      console.error("Failed to create folder:", e);
    }
  };

  const handleCreateFile = async (parentId: string | null) => {
    try {
      const res = await api.post<FileItem>(
        `/api/v1/projects/${projectId}/files`,
        {
          name: "新文档.md",
          folderId: parentId,
          isDir: false,
          content: "",
        },
      );
      await fetchData();
      setSelectedFile(res);
    } catch (e) {
      console.error("Failed to create file:", e);
    }
  };

  const handleDelete = async (id: string, type: "folder" | "file") => {
    const confirmMsg =
      type === "folder"
        ? "确定要删除这个目录吗？目录下的内容也会被删除。"
        : "确定要删除这个文件吗？";
    if (!confirm(confirmMsg)) return;
    try {
      const endpoint = type === "folder" ? `/folders/${id}` : `/files/${id}`;
      await api.delete(`/api/v1${endpoint}`);
      if (type === "file" && selectedFile?.id === id) {
        setSelectedFile(null);
      }
      await fetchData();
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleRename = (
    id: string,
    type: "folder" | "file",
    currentName: string,
  ) => {
    setRenameId(id);
    setRenameType(type);
    setRenameName(currentName);
    setRenameModalTitle(type === "folder" ? "重命名目录" : "重命名文件");
    setShowRenameModal(true);
  };

  const handleRenameSubmit = async () => {
    if (!renameName.trim()) return;
    try {
      if (renameType === "folder") {
        await api.put(`/api/v1/folders/${renameId}`, {
          name: renameName.trim(),
        });
      } else {
        await api.put(`/api/v1/files/${renameId}`, {
          name: renameName.trim(),
          folderId: null,
        });
      }
      setShowRenameModal(false);
      await fetchData();
    } catch (e) {
      console.error("Failed to rename:", e);
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      for (const file of files) {
        await api.upload(`/api/v1/projects/${projectId}/files/upload`, file);
      }
      await fetchData();
    } catch (e) {
      console.error("Failed to upload files:", e);
    }
  };

  const handleMove = async (
    id: string,
    type: "folder" | "file",
    name: string,
    newParentId: string,
  ) => {
    try {
      if (type === "folder") {
        await api.put(`/api/v1/folders/${id}`, {
          name,
          parentId: newParentId,
        });
      } else {
        await api.put(`/api/v1/files/${id}`, {
          name,
          folderId: newParentId,
        });
      }
      await fetchData();
    } catch (e) {
      console.error("Failed to move:", e);
      throw e;
    }
  };

  const handleSave = async (name: string, content: string) => {
    if (!selectedFile) return;
    try {
      await api.put(`/api/v1/files/${selectedFile.id}`, {
        name,
        folderId: selectedFile.folderId,
        content,
      });
      await fetchData();
    } catch (e) {
      console.error("Failed to save file:", e);
    }
  };

  if (loading) {
    return (
      <div className="w-64 border-r bg-gray-50 dark:bg-gray-800 flex items-center justify-center border-gray-200 dark:border-gray-700">
        <span className="text-gray-400 dark:text-gray-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="w-64 border-r bg-gray-50 dark:bg-gray-800 flex flex-col border-gray-200 dark:border-gray-700">
        <div className="p-3 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText size={18} />
            文件
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <FileTree
            nodes={treeData}
            selectedId={selectedFile?.id || null}
            onSelect={handleSelect}
            onCreateFolder={handleCreateFolder}
            onCreateFile={handleCreateFile}
            onDelete={handleDelete}
            onRename={handleRename}
            onUpload={handleUpload}
            onMove={handleMove}
          />
        </div>
      </div>

      <div className="flex-1">
        {selectedFile ? (
          <FileEditor
            key={selectedFile.id}
            fileId={selectedFile.id}
            name={selectedFile.name}
            content={selectedFile.content || ""}
            onSave={handleSave}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>选择或创建一个文件开始编写</p>
            </div>
          </div>
        )}
      </div>

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 m-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">新建目录</h3>
            <div>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="输入目录名称"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-200 dark:focus:border-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleFolderSubmit()}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleFolderSubmit}
                disabled={!newFolderName.trim()}
                className="px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 m-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {renameModalTitle}
            </h3>
            <div>
              <input
                type="text"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                placeholder="输入新名称"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-200 dark:focus:border-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRenameSubmit}
                disabled={!renameName.trim()}
                className="px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
