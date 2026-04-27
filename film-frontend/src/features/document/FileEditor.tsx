import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Save, Eye, Edit3 } from "lucide-react";

const IMAGE_EXTS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
];

function isImageFile(name: string): boolean {
  const ext = name.toLowerCase().substring(name.lastIndexOf("."));
  return IMAGE_EXTS.includes(ext);
}

interface FileEditorProps {
  fileId: string;
  name: string;
  content: string;
  onSave: (name: string, content: string) => void;
}

export function FileEditor({ fileId, name, content, onSave }: FileEditorProps) {
  const [editName, setEditName] = useState(name);
  const [editContent, setEditContent] = useState(content);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isImage = isImageFile(name);

  useEffect(() => {
    setEditName(name);
    setEditContent(content);
    setHasChanges(false);
  }, [fileId, name, content]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(editName, editContent);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [editName, editContent, onSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, hasChanges]);

  const handleNameChange = (value: string) => {
    setEditName(value);
    setHasChanges(true);
  };

  const handleContentChange = (value: string) => {
    setEditContent(value);
    setHasChanges(true);
  };

  if (isImage) {
    const imageUrl = `/api/v1/files/${fileId}/download`;
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={editName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="文件名称"
            className="flex-1 text-lg font-semibold bg-transparent border-none outline-none focus:outline-none text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={editName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={editName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="文件名称"
          className="flex-1 text-lg font-semibold bg-transparent border-none outline-none focus:outline-none text-gray-900 dark:text-gray-100"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`p-2 rounded-lg transition-colors ${
              isPreview
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
          >
            {isPreview ? <Edit3 size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              hasChanges && !isSaving
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
          >
            <Save size={16} />
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="h-full overflow-y-auto p-6 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {editContent}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={editContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="开始编写 Markdown 文档..."
            className="w-full h-full p-6 resize-none outline-none font-mono text-sm leading-relaxed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        )}
      </div>
    </div>
  );
}
