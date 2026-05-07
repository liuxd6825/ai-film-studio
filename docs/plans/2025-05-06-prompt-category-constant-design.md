# PromptCategory 常量化设计

## 概述

将 `PromptCategory` 从用户可编辑的数据库模型改为系统内置的硬编码常量，划分为四大类：会话、画布文字、画布图片、画布视频。

## 背景

当前 `PromptCategory` 是一个用户可编辑的数据库模型，支持 CRUD 操作。但实际业务场景中，这四类分类是系统固定的，不应由用户自由编辑。

## 设计方案

### 1. 数据模型变更

移除 `PromptCategory` 数据库模型，改为 Go 常量枚举：

```go
// internal/model/prompt_category.go
package model

type PromptCategoryType string

const (
    CategoryConversation PromptCategoryType = "conversation"   // 会话
    CategoryCanvasText   PromptCategoryType = "canvas_text"   // 画布文字
    CategoryCanvasImage  PromptCategoryType = "canvas_image"  // 画布图片
    CategoryCanvasVideo  PromptCategoryType = "canvas_video"  // 画布视频
)

var AllPromptCategories = []PromptCategory{
    {Key: CategoryConversation, Name: "会话", Description: "对话类提示词"},
    {Key: CategoryCanvasText,   Name: "画布文字", Description: "画布文本节点提示词"},
    {Key: CategoryCanvasImage,  Name: "画布图片", Description: "画布图片生成提示词"},
    {Key: CategoryCanvasVideo,  Name: "画布视频", Description: "画布视频生成提示词"},
}

type PromptCategory struct {
    Key         PromptCategoryType `json:"key"`
    Name        string             `json:"name"`
    Description string             `json:"description"`
}
```

### 2. Prompt 模型调整

`Prompt.CategoryID` 从 `uuid.UUID` 改为 `string`（存储 category key）：

```go
type Prompt struct {
    ...
    CategoryKey string `json:"categoryKey"`
    ...
}
```

### 3. API 变更

| 接口 | 变更 |
|------|------|
| `GET /prompt-categories` | 返回硬编码列表（不查库） |
| `POST /prompt-categories` | 移除 |
| `PUT /prompt-categories/:id` | 移除 |
| `DELETE /prompt-categories/:id` | 移除 |

### 4. 数据库迁移

- 删除 `prompt_category` 表
- `prompt` 表中 `category_id` 字段保留，可选迁移为 `category_key`（varchar 类型）

## 实施步骤

1. 修改 `model/prompt_category.go` - 改为常量定义
2. 修改 `model/prompt.go` - `CategoryID` 改为 `CategoryKey string`
3. 修改 `repository/prompt.go` - 更新相关查询
4. 修改 `service/prompt.go` - 使用 `CategoryKey` 替代 `CategoryID`
5. 修改 `handler/prompt.go` - 更新请求结构体
6. 修改 `handler/category.go` - 仅保留 List 方法，返回硬编码数据
7. 修改 `handler/router.go` - 移除 category 的 Create/Update/Delete 路由
8. 数据库迁移 - 删除 `prompt_category` 表

## 影响范围

- `internal/model/prompt_category.go`
- `internal/model/prompt.go`
- `internal/repository/prompt.go`
- `internal/service/prompt.go`
- `internal/handler/prompt.go`
- `internal/handler/category.go`
- `internal/handler/router.go`