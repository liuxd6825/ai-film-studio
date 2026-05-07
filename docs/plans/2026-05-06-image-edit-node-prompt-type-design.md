# ImageEditNode PromptType 下拉框设计

**日期：** 2026-05-06
**目标：** 为 `ImageEditNode` 添加 PromptType 下拉列表框，数据从 `/projects/:projectId/images/prompt-types` 获取，点击"生成"时提交 `promptType` 字段。

## 概述

在图片编辑节点的浮窗面板中添加 PromptType 下拉框，用户可选择不同的提示词类型（如"图片"、"六宫格"等），选择后点击"生成"时将 `promptType` 字段添加到请求体中。

## 涉及改动

| 文件 | 改动 |
|------|------|
| `film-backend/internal/handler/ai_image.go` | `GenerateImageRequest` 增加 `PromptType` 字段，传递给 service |
| `film-frontend/src/api/imageApi.ts` | 增加 `getPromptTypes()` 方法，`GenerateImageRequest` 增加 `promptType?` |
| `film-frontend/src/features/canvas/domain/canvasNodes.ts` | `ImageEditNodeData` 增加 `promptType?: string` |
| `film-frontend/src/features/canvas/nodes/ImageEditNode.tsx` | 添加下拉框，获取数据，提交时带 `promptType` |

## 后端改动

### `film-backend/internal/handler/ai_image.go`

**`GenerateImageRequest` 结构体新增字段：**
```go
PromptType string `json:"promptType,omitempty"`
```

**`Generate` 函数中传递：**
```go
imageReq := ai_image.GenerationRequest{
    // ...existing fields...
    PromptType: req.PromptType,
}
```

## 前端 API 层

### `film-frontend/src/api/imageApi.ts`

**`GenerateImageRequest` 新增字段：**
```typescript
promptType?: string;
```

**新增方法：**
```typescript
async getPromptTypes(projectId: string): Promise<PromptType[]>
```

**`PromptType` 类型：**
```typescript
export interface PromptType {
  id: string;
  title: string;
}
```

**`generate()` 方法透传 `promptType` 参数。**

## 类型定义

### `film-frontend/src/features/canvas/domain/canvasNodes.ts`

**`ImageEditNodeData` 新增字段：**
```typescript
promptType?: string;
```

## 组件改动

### `film-frontend/src/features/canvas/nodes/ImageEditNode.tsx`

1. 新增 state：`promptTypes`（`PromptType[]`）
2. `useEffect` 中当 `showFloatingPanel` 为 true 时，调用 `imageApi.getPromptTypes(projectId)` 获取数据
3. 在浮窗的设置区域添加 PromptType 下拉框（位置在 AspectRatio 选择器旁边）
4. `handleGenerate` 中的 `requestData` 增加 `promptType: data.promptType`

## 交互流程

```
用户打开浮窗 → 获取 promptTypes 列表 → 默认选中第一项
用户选择类型 → updateNodeData({ promptType: value })
用户点击生成 → requestData 包含 promptType → 提交到后端
```

## 数据流

```
ImageEditNode → imageApi.generate() → POST /projects/:projectId/images/generate
                                    { ..., promptType: "image" }
```

## 后端已有支持

- `ai_image.PromptType` 结构体已存在
- `ai_image.GenerationRequest` 已包含 `PromptType` 字段
- `GET /projects/:projectId/images/prompt-types` 接口已注册
- 只需在 handler 层透传字段即可