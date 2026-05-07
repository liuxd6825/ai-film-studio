# 可编辑节点标题设计文档

**日期**：2026-05-07
**主题**：为所有画布节点增加标题属性并支持在线编辑

## 1. 背景与目标

目前画布节点的标题（`displayName`）不支持在线编辑，用户无法直观地修改节点名称。本功能旨在提供双击即编辑的体验，提升用户体验。

## 2. 用户交互设计

### 交互方式
- **触发**：双击标题区域
- **编辑**：输入框自动获得焦点，可直接输入
- **保存**：回车键或失焦时保存
- **取消**：Esc 键取消编辑，恢复原值

### 显示格式
```
{节点类型} {标题}
```
示例：`图片 我的标题`、`视频`、`文本 工作流说明`

- 节点类型前缀始终显示（如"图片"、"视频"）
- 标题可为空，为空时仅显示节点类型

## 3. 功能规格

### 字符限制
- 标题最大长度为 50 个字符

### 空标题处理
- 允许空标题
- 空标题时渲染仅显示节点类型前缀

### 编辑保存策略
- 仅在失焦或回车时保存
- 不做实时防抖处理

### 应用范围
- 所有节点类型：ImageNode、ImageEditNode、VideoGenNode、VideoNode、TextNode、ExportImageNode、GroupNode、StoryboardNode、StoryboardGenNode 等
- GroupNode 使用 `label` 而非 `displayName`，需特殊处理

## 4. 技术方案

### 新建组件

**位置**：`film-frontend/src/features/canvas/components/EditableNodeTitle.tsx`

**Props**：
```typescript
interface EditableNodeTitleProps {
  nodeType: string;        // 显示名称，如"图片"、"视频"
  title: string;           // 当前标题（可为空）
  onSave: (title: string) => void;
  maxLength?: number;      // 默认 50
}
```

**状态**：
- `isEditing`: boolean - 是否处于编辑模式
- `editValue`: string - 编辑中的临时值

**交互处理**：
- `onDoubleClick` → 进入编辑模式，聚焦输入框
- `onBlur` → 保存并退出编辑
- `onKeyDown(Enter)` → 保存并退出编辑
- `onKeyDown(Esc)` → 取消编辑，恢复原值

### 各节点修改

| 节点组件 | 修改内容 |
|---------|---------|
| ImageNode.tsx | 标题区改用 EditableNodeTitle |
| ImageEditNode.tsx | 标题区改用 EditableNodeTitle |
| VideoGenNode.tsx | 标题区改用 EditableNodeTitle |
| VideoNode.tsx | 标题区改用 EditableNodeTitle |
| TextNode.tsx | 标题区改用 EditableNodeTitle |
| ExportImageNode.tsx | 标题区改用 EditableNodeTitle |
| GroupNode.tsx | label 使用 EditableNodeTitle（注意使用 label 而非 displayName） |
| TextAnnotationNode.tsx | 标题区改用 EditableNodeTitle |
| StoryboardNode.tsx | 标题区改用 EditableNodeTitle |
| StoryboardGenNode.tsx | 标题区改用 EditableNodeTitle |

### 使用示例

```tsx
<EditableNodeTitle
  nodeType="图片"
  title={data.displayName || ""}
  onSave={(newTitle) => updateNodeData(id, { displayName: newTitle })}
  maxLength={50}
/>
```

## 5. 样式考虑

- 编辑时输入框样式与普通标题一致
- 无边框或仅有底部边框，保持简洁
- 保持与现有节点标题相同的字体大小、颜色
- 支持 dark mode

## 6. 风险与注意事项

- GroupNode 使用 `label` 而非 `displayName`，需在 EditableNodeTitle 外层做适配
- 部分节点可能已有双击事件（如打开面板），需确保不冲突
- 移动端双击行为可能与预期不同，需测试
