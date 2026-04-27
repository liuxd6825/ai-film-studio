import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Edit2, Trash2, ExternalLink } from "lucide-react";
import { canvasApi, type CanvasData } from "../../../api/canvasApi";

interface EditDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

function EditDialog({ open, mode, initialName = "", onClose, onSubmit }: EditDialogProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName, open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
          {mode === "create" ? "新建画布" : "编辑画布名称"}
        </h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="请输入画布名称"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") onClose();
          }}
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            {mode === "create" ? "创建" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmDialogProps {
  open: boolean;
  canvasName: string;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmDialog({ open, canvasName, onClose, onConfirm }: DeleteConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">确认删除</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          确定要删除画布 "{canvasName}" 吗？此操作不可撤销。
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

export function CanvasListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [canvases, setCanvases] = useState<CanvasData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editingCanvas, setEditingCanvas] = useState<CanvasData | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCanvas, setDeletingCanvas] = useState<CanvasData | null>(null);

  const fetchCanvases = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const params: Parameters<typeof canvasApi.list>[1] = {};
      if (searchName) params.name = searchName;
      if (startDate) params.startDate = Math.floor(new Date(startDate).getTime() / 1000);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.endDate = Math.floor(end.getTime() / 1000);
      }

      const response = await canvasApi.list(projectId, params);
      setCanvases(response.canvases);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch canvases:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId, searchName, startDate, endDate]);

  useEffect(() => {
    fetchCanvases();
  }, [fetchCanvases]);

  const handleCreate = () => {
    setEditMode("create");
    setEditingCanvas(null);
    setEditDialogOpen(true);
  };

  const handleEdit = (canvas: CanvasData) => {
    setEditMode("edit");
    setEditingCanvas(canvas);
    setEditDialogOpen(true);
  };

  const handleSubmitEdit = async (name: string) => {
    if (!projectId) return;

    try {
      if (editMode === "create") {
        await canvasApi.create(projectId, { name });
      } else if (editingCanvas) {
        await canvasApi.update(projectId, editingCanvas.id, { name });
      }
      setEditDialogOpen(false);
      fetchCanvases();
    } catch (error) {
      console.error("Failed to save canvas:", error);
    }
  };

  const handleDelete = (canvas: CanvasData) => {
    setDeletingCanvas(canvas);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectId || !deletingCanvas) return;

    try {
      await canvasApi.delete(projectId, deletingCanvas.id);
      setDeleteDialogOpen(false);
      setDeletingCanvas(null);
      fetchCanvases();
    } catch (error) {
      console.error("Failed to delete canvas:", error);
    }
  };

  const handleOpen = (canvas: CanvasData) => {
    window.open(`/project/${projectId}/canvas/${canvas.id}`, "_blank");
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(`/project/${projectId}/chat`)}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>返回项目</span>
          </button>
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">画布列表</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="搜索画布名称..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <span className="text-gray-400 dark:text-gray-500">至</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>新建画布</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500 dark:text-gray-400">加载中...</span>
          </div>
        ) : canvases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>暂无画布</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              创建第一个画布
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {canvases.map((canvas) => (
              <div
                key={canvas.id}
                className="relative group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
                onClick={() => handleOpen(canvas)}
              >
                <div className="p-6">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate pr-20">
                    {canvas.name || "未命名"}
                  </h3>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpen(canvas);
                    }}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 rounded-lg shadow-sm transition-colors"
                    title="打开"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(canvas);
                    }}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-green-500 rounded-lg shadow-sm transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(canvas);
                    }}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 rounded-lg shadow-sm transition-colors"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && total > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            共 {total} 条记录
          </div>
        )}
      </main>

      <EditDialog
        open={editDialogOpen}
        mode={editMode}
        initialName={editingCanvas?.name || ""}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleSubmitEdit}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        canvasName={deletingCanvas?.name || ""}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
