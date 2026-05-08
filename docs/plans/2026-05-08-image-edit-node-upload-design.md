# ImageEditNode prompt 模式工具栏上传功能设计

## 需求

在 `ImageEditNode` 组件的 **prompt 模式**下，为工具栏新增一个上传按钮，允许用户本地上传图片替换当前节点的主图，同时保持在 prompt 模式。

## 背景

`ImageEditNode` 组件有三种状态（mode）：
- `undecided`：初始状态，工具栏显示"上传"按钮
- `upload`：已上传状态，工具栏显示"替换"按钮
- `prompt`：提示词模式，工具栏显示"选择"按钮（从已有关联图片选择）

当前 prompt 模式缺少本地上传功能，用户无法直接上传本地图片作为主图。

## 解决方案

在 prompt 模式的工具栏中新增 Upload 按钮，复用现有的 `fileInputRef` 和 `handleFileInput` 逻辑。

上传成功后 `handleFile` 会更新 `imageUrl` 和 `previewImageUrl`，`mode` 保持 `'prompt'` 不变。

## 改动文件

| 文件 | 改动 |
|------|------|
| `film-frontend/src/features/canvas/nodes/ImageEditNode.tsx` | prompt 模式工具栏新增 Upload 按钮（第 692 行附近） |

## 具体改动

在 `NodeToolbar` 中，`effectiveMode === 'prompt'` 分支下新增 Upload 按钮：

```tsx
{effectiveMode === 'prompt' && (
  <>
    {/* 新增：上传按钮 */}
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        fileInputRef.current?.click();
      }}
      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
      title="上传"
    >
      <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    </button>
    {/* 已有：选择按钮 */}
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setShowImageSelector(true);
      }}
      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
      title="选择"
    >
      <Image className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    </button>
  </>
)}
```

## 复用逻辑

- `fileInputRef`：已存在的 hidden file input ref
- `handleFileInput`：已存在的 file input onChange handler
- `handleFile`：已存在的上传逻辑，更新 `imageUrl`、`previewImageUrl`，设置 `sourceType: 'upload'` 和 `mode: 'upload'`

**注意**：`handleFile` 中会将 mode 设为 `'upload'`，但需求是保持在 `'prompt'` 模式。需要在调用前或通过额外逻辑覆盖此行为。

## 验证方式

1. 切换到 prompt 模式节点
2. 点击工具栏新增的"上传"按钮
3. 选择本地图片上传
4. 验证图片成功替换主图
5. 验证 mode 保持为 `'prompt'`