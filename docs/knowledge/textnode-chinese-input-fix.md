# TextNode 中文输入问题解决方案

## 问题描述

TextNode 组件中的 Content 输入框无法使用中文输入法输入，但浮窗中的 Prompt 输入框可以正常输入中文。

## 问题根因

1. **事件对象时序问题**：在 `onCompositionEnd` 事件触发时，React 的合成事件对象 `e.target` 可能尚未包含最终的中文组合文本
2. **ref 使用冲突**：Content 输入框和浮窗 Prompt 输入框共享同一个 `textareaRef`，导致 ref 指向混乱

## 解决方案

### 1. 分离 Content 输入框的 ref

```typescript
// 添加独立的 ref
const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
```

### 2. 创建 Content 专用的 handlers

```typescript
const handleContentChange = useCallback(
  (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isComposingRef.current) {
      return;
    }
    updateNodeData(id, { content: e.currentTarget.value });
  },
  [id, updateNodeData],
);

const handleContentCompositionEnd = useCallback(
  (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false;
    updateNodeData(id, { content: e.currentTarget.value });
  },
  [id, updateNodeData],
);
```

### 3. 使用 NodeTextarea 组件

使用自定义的 `NodeTextarea` 组件替代原生 `<textarea>`，该组件内部自动处理 `nodrag nowheel` 和事件冒泡问题。

```tsx
<NodeTextarea
  ref={contentTextareaRef}
  className="h-full overflow-auto"
  placeholder="输入内容..."
  defaultValue={data.content || ""}
  onCompositionStart={handleCompositionStart}
  onCompositionEnd={handleContentCompositionEnd}
  onChange={handleContentChange}
  onKeyDown={handleKeyDown}
  onBlur={handleFinishEditing}
  onClick={(e) => {
    e.currentTarget.selectionStart = e.currentTarget.selectionEnd;
  }}
/>
```

## 关键点总结

1. **分离 ref**：Content 输入框和 Prompt 输入框使用独立的 ref，避免冲突
2. **使用 `e.currentTarget.value`**：在事件处理中读取当前触发元素的值，而非 `e.target`
3. **使用 NodeTextarea 组件**：统一处理 `nodrag nowheel` 和事件冒泡问题

## 相关文件

- `src/features/canvas/nodes/TextNode.tsx` - TextNode 组件
- `src/features/canvas/components/NodeTextarea.tsx` - 自定义 Textarea 组件