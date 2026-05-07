# 可编辑节点标题实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 为所有画布节点添加双击即可编辑标题的功能

**架构：** 创建可复用的 `EditableNodeTitle` 组件，通过 props 传入节点类型和当前标题，各节点组件替换原有的静态标题显示

**技术栈：** React, TypeScript, Zustand (canvasStore)

---

## Task 1: 创建 EditableNodeTitle 组件

**Files:**
- Create: `film-frontend/src/features/canvas/components/EditableNodeTitle.tsx`

**Step 1: 创建组件文件**

```tsx
import { memo, useState, useRef, useCallback } from "react";

interface EditableNodeTitleProps {
  nodeType: string;
  title: string;
  onSave: (title: string) => void;
  maxLength?: number;
}

export const EditableNodeTitle = memo(function EditableNodeTitle({
  nodeType,
  title,
  onSave,
  maxLength = 50,
}: EditableNodeTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback(() => {
    setEditValue(title);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [title]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.slice(0, maxLength).trim();
    onSave(trimmed);
    setIsEditing(false);
  }, [editValue, maxLength, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(title);
    setIsEditing(false);
  }, [title]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  return (
    <span
      className="font-medium text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
      onDoubleClick={handleDoubleClick}
    >
      {nodeType}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          className="ml-1 px-1 py-0.5 text-sm border border-blue-400 rounded outline-none bg-white dark:bg-gray-700"
          style={{ width: `${Math.max(60, editValue.length * 8 + 20)}px` }}
        />
      ) : (
        title && <span className="ml-1">{title}</span>
      )}
    </span>
  );
});
```

**Step 2: 验证文件创建成功**

Run: `ls -la film-frontend/src/features/canvas/components/EditableNodeTitle.tsx`
Expected: 文件存在

**Step 3: Commit**

```bash
git add film-frontend/src/features/canvas/components/EditableNodeTitle.tsx
git commit -m "feat(canvas): add EditableNodeTitle component"
```

---

## Task 2: 修改 ImageEditNode 标题区域

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/ImageEditNode.tsx:736-739`

**Step 1: 导入 EditableNodeTitle**

在文件顶部 import 部分添加：
```tsx
import { EditableNodeTitle } from "../components/EditableNodeTitle";
```

**Step 2: 替换标题渲染代码**

找到原代码（约 line 737-739）：
```tsx
<span className="font-medium text-sm text-gray-900 dark:text-gray-100">
  {data.displayName || "图片"}
</span>
```

替换为：
```tsx
<EditableNodeTitle
  nodeType="图片"
  title={data.displayName || ""}
  onSave={(newTitle) => updateNodeData(id, { displayName: newTitle })}
  maxLength={50}
/>
```

**Step 3: 验证修改**

Run: `npx tsc --noEmit film-frontend/src/features/canvas/nodes/ImageEditNode.tsx 2>&1 | head -10`
Expected: 无 ImageEditNode 相关错误

**Step 4: Commit**

```bash
git add film-frontend/src/features/canvas/nodes/ImageEditNode.tsx
git commit -m "feat(canvas): make ImageEditNode title editable"
```

---

## Task 3: 修改 ImageNode 标题区域

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/ImageNode.tsx`

**Step 1: 找到并替换标题渲染代码**

ImageNode 约 line 200 附近：
```tsx
{data.displayName || "图片"}
```

替换为：
```tsx
<EditableNodeTitle
  nodeType="图片"
  title={data.displayName || ""}
  onSave={(newTitle) => updateNodeData(id, { displayName: newTitle })}
  maxLength={50}
/>
```

**Step 2: 添加 import**

```tsx
import { EditableNodeTitle } from "../components/EditableNodeTitle";
```

**Step 3: Commit**

```bash
git add film-frontend/src/features/canvas/nodes/ImageNode.tsx
git commit -m "feat(canvas): make ImageNode title editable"
```

---

## Task 4: 修改 VideoGenNode 标题区域

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/VideoGenNode.tsx`

**Step 1: 找到并替换标题渲染代码**

约 line 835 附近：
```tsx
{data.displayName || "视频"}
```

替换为：
```tsx
<EditableNodeTitle
  nodeType="视频"
  title={data.displayName || ""}
  onSave={(newTitle) => updateNodeData(id, { displayName: newTitle })}
  maxLength={50}
/>
```

**Step 2: 添加 import**

```tsx
import { EditableNodeTitle } from "../components/EditableNodeTitle";
```

**Step 3: Commit**

```bash
git add film-frontend/src/features/canvas/nodes/VideoGenNode.tsx
git commit -m "feat(canvas): make VideoGenNode title editable"
```

---

## Task 5: 修改 VideoNode 标题区域

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/VideoNode.tsx`

**Step 1: 找到并替换标题渲染代码**

约 line 280 附近：
```tsx
{data.displayName || "视频"}
```

替换为：
```tsx
<EditableNodeTitle
  nodeType="视频"
  title={data.displayName || ""}
  onSave={(newTitle) => updateNodeData(id, { displayName: newTitle })}
  maxLength={50}
/>
```

**Step 2: 添加 import**

```tsx
import { EditableNodeTitle } from "../components/EditableNodeTitle";
```

**Step 3: Commit**

```bash
git add film-frontend/src/features/canvas/nodes/VideoNode.tsx
git commit -m "feat(canvas): make VideoNode title editable"
```

---

## Task 6: 修改 TextNode 标题区域

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/TextNode.tsx`

**Step 1: 找到并替换标题渲染代码**

约 line 457 附近：
```tsx
{data.displayName || "文本"}
```

替换为：
```tsx
<EditableNodeTitle
  nodeType="文本"
  title={data.displayName || ""}
  onSave={(newTitle) => updateNodeData(id, { displayName: newTitle })}
  maxLength={50}
/>
```

**Step 2: 添加 import**

```tsx
import { EditableNodeTitle } from "../components/EditableNodeTitle";
```

**Step 3: Commit**

```bash
git add film-frontend/src/features/canvas/nodes/TextNode.tsx
git commit -m "feat(canvas): make TextNode title editable"
```

---

## Task 7: 修改 ExportImageNode 标题区域

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/ExportImageNode.tsx`

**Step 1: 找到并替换标题渲染代码**

约 line 200 附近：
```tsx
{data.displayName || "导出图片"}
```

替换为：
```tsx
<EditableNodeTitle
  nodeType="导出图片"
  title={data.displayName || ""}
  onSave={(newTitle) => updateNodeData(id, { displayName: newTitle })}
  maxLength={50}
/>
```

**Step 2: 添加 import**

```tsx
import { EditableNodeTitle } from "../components/EditableNodeTitle";
```

**Step 3: Commit**

```bash
git add film-frontend/src/features/canvas/nodes/ExportImageNode.tsx
git commit -m "feat(canvas): make ExportImageNode title editable"
```

---

## Task 8: 修改 GroupNode 标题区域（特殊处理 label）

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/GroupNode.tsx`

**Step 1: 找到并替换标题渲染代码**

约 line 60 附近：
```tsx
{data.label || "分组"}
```

替换为：
```tsx
<EditableNodeTitle
  nodeType="分组"
  title={data.label || ""}
  onSave={(newTitle) => updateNodeData(id, { label: newTitle })}
  maxLength={50}
/>
```

注意：GroupNode 使用 `label` 而非 `displayName`

**Step 2: 添加 import**

```tsx
import { EditableNodeTitle } from "../components/EditableNodeTitle";
```

**Step 3: Commit**

```bash
git add film-frontend/src/features/canvas/nodes/GroupNode.tsx
git commit -m "feat(canvas): make GroupNode title editable"
```

---

## Task 9: 修改其他剩余节点

**Files:**
- Modify: `film-frontend/src/features/canvas/nodes/TextAnnotationNode.tsx`
- Modify: `film-frontend/src/features/canvas/nodes/StoryboardNode.tsx`
- Modify: `film-frontend/src/features/canvas/nodes/StoryboardGenNode.tsx`

**Step 1: 对每个节点重复 Task 2-8 的模式**

找到标题渲染代码，替换为 EditableNodeTitle：
- TextAnnotationNode → `nodeType="文本标注"`
- StoryboardNode → `nodeType="故事板"`
- StoryboardGenNode → `nodeType="故事板生成"`

**Step 2: Commit**

```bash
git add \
  film-frontend/src/features/canvas/nodes/TextAnnotationNode.tsx \
  film-frontend/src/features/canvas/nodes/StoryboardNode.tsx \
  film-frontend/src/features/canvas/nodes/StoryboardGenNode.tsx
git commit -m "feat(canvas): make remaining nodes title editable"
```

---

## Task 10: 验证所有节点类型检查通过

**Step 1: 运行 TypeScript 类型检查**

Run: `cd film-frontend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20`
Expected: 无错误或仅有预先存在的错误

**Step 2: 测试交互功能**

手动测试：
1. 在画布上创建 ImageEditNode
2. 双击标题区域
3. 输入新标题
4. 按 Enter 或失焦
5. 刷新页面验证标题保存
6. 测试 Esc 取消编辑

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(canvas): add editable node title to all node types"
```

---

## 总结

完成所有任务后，以下节点将支持双击编辑标题：

| 节点 | 字段 |
|------|------|
| ImageNode | displayName |
| ImageEditNode | displayName |
| VideoGenNode | displayName |
| VideoNode | displayName |
| TextNode | displayName |
| ExportImageNode | displayName |
| GroupNode | label |
| TextAnnotationNode | displayName |
| StoryboardNode | displayName |
| StoryboardGenNode | displayName |
