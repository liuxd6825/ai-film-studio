# ImageEditNode 图片上传功能整合实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 ImageEditNode 增加图片上传功能，实现双模式选择机制

**Architecture:** 修改 ImageEditNode 组件，添加上传逻辑和数据结构字段，在 undecided 状态下显示双入口，选择后锁定模式

**Tech Stack:** React, TypeScript, Zustand (canvasStore)

---

## Task 1: 更新类型定义

**Files:**
- Modify: `film-frontend/src/features/canvas/domain/canvasNodes.ts:110-125`
- Modify: `film-frontend/src/features/canvas/domain/nodeRegistry.ts:105-121`

**Step 1: 修改 ImageEditNodeData 接口**

在 `canvasNodes.ts` 中，`ImageEditNodeData` 接口新增字段：

```typescript
export interface ImageEditNodeData extends NodeImageData {
  prompt: string;
  workMode: ImageEditWorkMode;
  aiModel: ImageEditAIModel;
  size: ImageSize;
  requestAspectRatio?: string;
  extraParams?: Record<string, unknown>;
  isGenerating?: boolean;
  generationStartedAt?: number | null;
  generationDurationMs?: number;
  referenceImages?: string[];
  taskId?: string;
  taskStatus?: ImageEditTaskStatus;
  taskProgress?: number;
  errorMessage?: string;
  // 新增字段
  mode?: 'undecided' | 'upload' | 'prompt';
  sourceType?: 'upload' | 'generated' | 'reference';
  sourceFileName?: string | null;
}
```

**Step 2: 更新 nodeRegistry.ts 的 createDefaultData**

在 `imageEditNodeDefinition` 的 `createDefaultData` 中添加 `mode: 'undecided'`:

```typescript
createDefaultData: () => ({
  displayName: DEFAULT_NODE_DISPLAY_NAME[CANVAS_NODE_TYPES.imageEdit],
  imageUrl: null,
  previewImageUrl: null,
  aspectRatio: DEFAULT_ASPECT_RATIO,
  isSizeManuallyAdjusted: false,
  requestAspectRatio: "16:9",
  prompt: "",
  workMode: "text-to-image",
  aiModel: "dall-e-2",
  size: "2K" as ImageSize,
  extraParams: {},
  isGenerating: false,
  generationStartedAt: null,
  generationDurationMs: 60000,
  mode: 'undecided',  // 新增
}),
```

**Step 3: 验证类型更新**

运行 `npm run typecheck` 确认无类型错误

---

## Task 2: 整合上传逻辑到 ImageEditNode

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/ImageEditNode.tsx`

**Step 1: 添加新的 state 和 ref**

在现有的 state 声明区域添加：

```typescript
const [isUploading, setIsUploading] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
```

**Step 2: 导入 canvasFileApi**

确认已导入：

```typescript
import { canvasFileApi } from "../../../api/canvasFileApi";
```

**Step 3: 添加 handleFile 函数**

参考 ImageNode 的实现，添加：

```typescript
const handleFile = useCallback(
  async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    if (!projectId || !canvasId) {
      console.error("Missing projectId or canvasId");
      return;
    }

    setIsUploading(true);
    try {
      const response = await canvasFileApi.upload(
        projectId,
        canvasId,
        id,
        file,
      );
      updateNodeData(id, {
        imageUrl: response.downloadUrl,
        previewImageUrl: response.downloadUrl,
        sourceFileName: file.name,
        sourceType: 'upload',
        mode: 'upload',
      });
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setIsUploading(false);
    }
  },
  [id, projectId, canvasId, updateNodeData],
);
```

**Step 4: 添加拖拽和粘贴处理函数**

```typescript
const handleDragOver = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
}, []);

const handleDragLeave = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
}, []);

const handleDrop = useCallback(
  (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  },
  [handleFile],
);

const handlePaste = useCallback(
  (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
        }
      }
    }
  },
  [handleFile],
);

const handleFileInput = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  },
  [handleFile],
);
```

**Step 5: 修改 handleGenerate 添加模式锁定**

找到 `handleGenerate` 函数，在函数开始处添加：

```typescript
const handleGenerate = useCallback(async () => {
  if (!data.prompt?.trim()) {
    setError("请输入提示词");
    return;
  }

  // 锁定为 prompt 模式
  if (data.mode === 'undecided') {
    updateNodeData(id, { mode: 'prompt', sourceType: 'generated' });
  }
  // ... 后续代码不变
}, [...]);
```

注意：`handleGenerate` 的依赖数组需要更新，添加 `data.mode` 和 `updateNodeData`

---

## Task 3: 实现 undecided 状态 UI

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/ImageEditNode.tsx`

**Step 1: 在组件返回值中添加 hidden file input**

在 `return` 的 JSX 中，在 `NodeToolbar` 之前或之后添加：

```typescript
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleFileInput}
/>
```

**Step 2: 创建 undecided 状态的选择面板**

找到图片预览区域（`resultRef` 所在的 div），修改其内容：

```typescript
{/* undecided 状态下的选择面板 */}
{data.mode === 'undecided' && (
  <div className="h-40 p-3 flex items-center justify-center gap-4">
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleFileInput}
    />
    {/* 上传入口卡片 */}
    <div
      className="flex-1 h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="w-8 h-8 text-gray-400 mb-2" />
      <span className="text-sm text-gray-600 dark:text-gray-400">上传图片</span>
      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">拖拽、粘贴或点击</span>
    </div>
    {/* AI 生成入口卡片 */}
    <div
      className="flex-1 h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
      onClick={() => {
        setShowFloatingPanel(true);
        updateNodeData(id, { mode: 'prompt' });
      }}
    >
      <Sparkles className="w-8 h-8 text-gray-400 mb-2" />
      <span className="text-sm text-gray-600 dark:text-gray-400">AI 生成</span>
      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">输入提示词创作</span>
    </div>
  </div>
)}
```

**Step 3: 添加 Sparkles 和 Upload 图标导入**

检查 `lucide-react` 导入，确保包含：

```typescript
import { Eye, X, Download, Trash2, Image, Upload, Sparkles } from "lucide-react";
```

---

## Task 4: 实现条件渲染逻辑

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/ImageEditNode.tsx`

**Step 1: 修改 resultRef 区域的渲染逻辑**

原有的图片预览区域需要根据 mode 条件渲染：

```typescript
{/* upload 模式 - 显示上传的图片 */}
{data.mode === 'upload' && data.imageUrl && (
  <div className="h-40 p-1.5 cursor-pointer" onClick={handleResultClick}>
    {/* 现有图片显示逻辑 */}
  </div>
)}

{/* prompt 模式 - 显示空的预览区域，点击后打开面板 */}
{data.mode === 'prompt' && (
  <div
    className="h-40 p-1.5 cursor-pointer"
    onClick={() => setShowFloatingPanel(true)}
  >
    {/* 空状态显示 */}
  </div>
)}
```

**Step 2: 修改 floatingPanel 的显示条件**

找到 `{showFloatingPanel && (` 部分，确保：

1. `prompt` 模式下自动打开面板（如果 `mode === 'prompt'` 且面板未打开）
2. 面板内的 UI 保持不变（因为 prompt 模式行为不变）

**Step 3: 修改工具栏的 ImageSelectorModal 调用**

在 `showImageSelector && projectId && (` 之前添加条件：

```typescript
{/* ImageSelectorModal 仅在 upload 或 prompt 模式下显示 */}
{(data.mode === 'upload' || data.mode === 'prompt') && showImageSelector && projectId && (
  <ImageSelectorModal
    projectId={projectId}
    nodeId={id}
    currentImageUrl={data.imageUrl || null}
    onSelect={handleImageSelect}
    onClose={handleCloseImageSelector}
  />
)}
```

**Step 4: 添加拖拽粘贴事件到主容器**

找到最外层的 `div`（`className="min-w-[200px] bg-white...`），添加：

```typescript
onDragOver={handleDragOver}
onDragLeave={handleDragLeave}
onDrop={handleDrop}
onPaste={handlePaste}
```

---

## Task 5: 添加工具栏上传按钮

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/ImageEditNode.tsx`

**Step 1: 修改工具栏的上传按钮**

找到工具栏中打开 `ImageSelectorModal` 的按钮，添加 `data.mode` 条件：

```typescript
{/* 仅在 upload 模式或未决定时显示图片选择按钮 */}
{(data.mode === 'undecided' || data.mode === 'upload') && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      if (data.mode === 'undecided') {
        fileInputRef.current?.click();
      } else {
        setShowImageSelector(true);
      }
    }}
    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
    title={data.mode === 'undecided' ? "上传" : "选择"}
  >
    <Image className="w-4 h-4 text-gray-600 dark:text-gray-400" />
  </button>
)}
```

---

## Task 6: 兼容性处理

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/ImageEditNode.tsx`

**Step 1: 添加 mode 默认值处理**

在组件内部，添加一个 `effectiveMode` 变量处理兼容：

```typescript
const effectiveMode = data.mode || 'prompt';  // 兼容旧数据
```

然后将所有 `data.mode ===` 替换为 `effectiveMode ===`

---

## Task 7: 验证与测试

**Step 1: 运行类型检查**

```bash
cd film-frontend && npm run typecheck
```

**Step 2: 启动开发服务器**

```bash
cd film-frontend && npm run dev
```

**Step 3: 手动测试场景**

1. 新建 ImageEditNode，确认显示两个入口
2. 点击上传入口，上传图片，确认模式锁定为 upload
3. 新建另一个 ImageEditNode，点击 AI 生成入口，确认模式锁定为 prompt
4. 确认 prompt 模式下提示词面板正常显示
5. 确认 upload 模式下拖拽粘贴功能正常
6. 确认与其他节点的连接正常

---

## 执行选项

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
