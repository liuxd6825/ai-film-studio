# ReactFlow 模态框拖拽问题解决方案

## 问题描述

在 ReactFlow 画布中，当某个节点（如 ImageEditNode）内部渲染一个使用 `fixed` 定位的模态框（如 TextNodeOrderModal）时，模态框内的拖拽排序功能无法正常工作。具体表现为：

- 在模态框中拖动列表项时，窗口也会移动
- dnd-kit 的拖拽预览无法正常显示
- 拖拽事件被拦截

## 问题根因

ReactFlow 的节点组件可能被 ReactFlow 库添加了 `transform` CSS 属性（用于缩放、平移等画布操作）。当一个元素带有 `transform` 的祖先元素时，其 `position: fixed` 不再相对于视口定位，而是相对于该祖先元素定位。

这导致：
1. `fixed` 定位的模态框位置计算错误
2. 拖拽事件被 ReactFlow 画布拦截
3. 浏览器将拖动操作解释为窗口移动

## 解决方案

将模态框从节点内部移到 Canvas 最外层渲染，确保模态框在 ReactFlow 画布外部，不受 transform 影响。

### 步骤 1：在 canvasStore 中添加状态和方法

```typescript
// 添加状态类型
textNodeOrderModal: {
  isOpen: boolean;
  targetNodeId: string | null;
};

// 添加 Actions
openTextNodeOrderModal: (nodeId: string) => void;
closeTextNodeOrderModal: () => void;
```

### 步骤 2：修改节点组件

移除模态框的本地状态和渲染，改为调用 store 方法：

```typescript
// 之前
const [showTextNodeOrder, setShowTextNodeOrder] = useState(false);

// 之后
const openTextNodeOrderModal = useCanvasStore((s) => s.openTextNodeOrderModal);

// 按钮 onClick
onClick={() => openTextNodeOrderModal(id)}

// 移除模态框渲染
```

### 步骤 3：在 Canvas.tsx 中渲染模态框

在 Canvas 组件的最外层 div 内（ReactFlow 组件外部）渲染模态框：

```tsx
<div className="w-full h-full relative">
  <ReactFlow ...>
    {/* 画布内容 */}
  </ReactFlow>

  {/* 模态框放在这里 - ReactFlow 外部 */}
  {textNodeOrderModal.isOpen && textNodeOrderModal.targetNodeId && (
    <TextNodeOrderModal
      targetNodeId={textNodeOrderModal.targetNodeId}
      onClose={closeTextNodeOrderModal}
    />
  )}
</div>
```

## 关键点

1. **模态框必须在 ReactFlow 外部渲染** - 确保 `position: fixed` 正常工作
2. **使用 zustand store 管理状态** - 避免节点与 Canvas 之间的 prop drilling
3. **通过 store 方法打开/关闭模态框** - 解耦节点和模态框渲染逻辑

## 相关文件

- `film-frontend/src/features/canvas/stores/canvasStore.ts` - 状态管理
- `film-frontend/src/features/canvas/Canvas.tsx` - 模态框渲染位置
- `film-frontend/src/features/canvas/nodes/ImageEditNode.tsx` - 调用方
- `film-frontend/src/features/canvas/ui/TextNodeOrderModal.tsx` - 模态框组件