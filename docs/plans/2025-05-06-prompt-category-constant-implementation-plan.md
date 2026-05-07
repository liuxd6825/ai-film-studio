# PromptCategory 常量化实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `PromptCategory` 从数据库模型改为系统硬编码常量，移除用户对分类的 CRUD 操作。

**Architecture:** 通过 Go 常量枚举替代数据库表，API 层仅保留读取接口，返回预定义的四类分类。

**Tech Stack:** Go, GORM, Iris, SQLite

---

## Task 1: 修改 PromptCategory 模型为常量

**Files:**
- Modify: `film-backend/internal/model/prompt_category.go`

**Step 1: 重写模型文件**

```go
package model

type PromptCategoryType string

const (
    CategoryConversation PromptCategoryType = "conversation" // 会话
    CategoryCanvasText   PromptCategoryType = "canvas_text" // 画布文字
    CategoryCanvasImage  PromptCategoryType = "canvas_image" // 画布图片
    CategoryCanvasVideo  PromptCategoryType = "canvas_video" // 画布视频
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

**Step 2: 提交**

```bash
git add film-backend/internal/model/prompt_category.go
git commit -m "refactor: convert PromptCategory to hardcoded constants"
```

---

## Task 2: 修改 Prompt 模型 - CategoryID 改为 CategoryKey

**Files:**
- Modify: `film-backend/internal/model/prompt.go`

**Step 1: 修改 CategoryID 为 CategoryKey**

将 `CategoryID uuid.UUID` 改为 `CategoryKey string`：

```go
type Prompt struct {
    ID         uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
    ProjectID  uuid.UUID `gorm:"type:char(36);index" json:"projectId"`
    Title      string    `gorm:"size:255;not null" json:"title"`
    Content    string    `gorm:"type:text" json:"content"`
    CategoryKey string   `gorm:"column:category_key;size:50" json:"categoryKey"`
    Tags       string    `gorm:"type:text" json:"tags"`
    Variables  string    `gorm:"type:text" json:"variables"`
    Version    int       `gorm:"default:1" json:"version"`
    IsLatest   bool      `gorm:"default:true" json:"isLatest"`
    CreatedAt  time.Time `gorm:"createdAt" json:"createdAt"`
    UpdatedAt  time.Time `gorm:"createdAt" json:"updatedAt"`
}
```

**Step 2: 提交**

```bash
git add film-backend/internal/model/prompt.go
git commit -m "refactor: rename CategoryID to CategoryKey in Prompt model"
```

---

## Task 3: 修改 PromptRepository - 适配 CategoryKey

**Files:**
- Modify: `film-backend/internal/repository/prompt.go`

**Step 1: 更新 ListByCategoryID 方法**

将 `categoryID uuid.UUID` 改为 `categoryKey string`：

```go
func (r *PromptRepository) ListByCategoryKey(ctx context.Context, projectID uuid.UUID, categoryKey string) ([]model.Prompt, error) {
    var prompts []model.Prompt
    query := r.db.WithContext(ctx).Where("project_id = ? AND category_key = ? AND is_latest = ?", projectID, categoryKey, true)
    err := query.Order("updated_at DESC").Find(&prompts).Error
    return prompts, err
}
```

**Step 2: 更新 ListByProjectID 方法**

移除 categoryID 参数或改为可选的 categoryKey 筛选。

**Step 3: 提交**

```bash
git add film-backend/internal/repository/prompt.go
git commit -m "refactor: update PromptRepository to use CategoryKey"
```

---

## Task 4: 修改 PromptService - 适配 CategoryKey

**Files:**
- Modify: `film-backend/internal/service/prompt.go`

**Step 1: 更新 CreatePromptRequest**

将 `CategoryID uuid.UUID` 改为 `CategoryKey string`：

```go
type CreatePromptRequest struct {
    ProjectID   uuid.UUID              `json:"projectId"`
    Title       string                 `json:"title"`
    Content     string                 `json:"content"`
    CategoryKey string                 `json:"categoryKey"`
    Tags        []string               `json:"tags"`
    Variables   []model.PromptVariable `json:"variables"`
}
```

**Step 2: 更新 UpdatePromptRequest**

同样将 `CategoryID` 改为 `CategoryKey`。

**Step 3: 修改 Create 方法**

使用 `req.CategoryKey` 替代 `req.CategoryID`。

**Step 4: 修改 Update 方法**

使用 `req.CategoryKey` 替代 `req.CategoryID`。

**Step 5: 修改 List 方法**

将 `categoryID uuid.UUID` 参数改为 `categoryKey string`。

**Step 6: 提交**

```bash
git add film-backend/internal/service/prompt.go
git commit -m "refactor: update PromptService to use CategoryKey"
```

---

## Task 5: 修改 PromptHandler - 更新请求结构体

**Files:**
- Modify: `film-backend/internal/handler/prompt.go`

**Step 1: 更新 CreatePromptRequest**

将 `CategoryID string` 改为 `CategoryKey string`。

**Step 2: 更新 UpdatePromptRequest**

将 `CategoryID string` 改为 `CategoryKey string`。

**Step 3: 修改 Create 方法**

移除 `uuid.Parse(req.CategoryID)` 逻辑，直接使用 `req.CategoryKey`。

**Step 4: 修改 Update 方法**

移除 `uuid.Parse(req.CategoryID)` 逻辑。

**Step 5: 修改 List 方法**

将 `CategoryID string` 改为 `CategoryKey string`。

**Step 6: 提交**

```bash
git add film-backend/internal/handler/prompt.go
git commit -m "refactor: update PromptHandler to use CategoryKey"
```

---

## Task 6: 修改 CategoryHandler - 移除 CRUD 仅保留 List

**Files:**
- Modify: `film-backend/internal/handler/category.go`

**Step 1: 重写 CategoryHandler**

移除 Create/Update/Delete 方法，仅保留 List 返回硬编码数据：

```go
package handler

import (
    "github.com/kataras/iris/v12"

    "open-film-service/internal/model"
)

type CategoryHandler struct{}

func NewCategoryHandler() *CategoryHandler {
    return &CategoryHandler{}
}

func (h *CategoryHandler) List(ctx iris.Context) {
    ctx.JSON(iris.Map{
        "code": 200,
        "data": model.AllPromptCategories,
    })
}
```

**Step 2: 提交**

```bash
git add film-backend/internal/handler/category.go
git commit -m "refactor: simplify CategoryHandler to return hardcoded categories"
```

---

## Task 7: 修改 Router - 移除 Category 的写路由

**Files:**
- Modify: `film-backend/internal/handler/router.go`

**Step 1: 修改路由配置**

移除 category 的 Create/Update/Delete 路由：

```go
// Prompt Category 路由
api.Get("/prompt-categories", h.Category.List)
// 移除 POST /prompt-categories
// 移除 PUT /prompt-categories/:id
// 移除 DELETE /prompt-categories/:id
```

**Step 2: 提交**

```bash
git add film-backend/internal/handler/router.go
git commit -m "refactor: remove PromptCategory write routes from router"
```

---

## Task 8: 移除 CategoryRepository 和 CategoryService

**Files:**
- Delete: `film-backend/internal/repository/category.go`
- Delete: `film-backend/internal/service/category.go`

**Step 1: 删除这两个文件**

**Step 2: 更新 wire 或 main.go 中的依赖注入（如果有）**

检查是否有地方引用了 `NewCategoryRepository` 或 `NewCategoryService`。

**Step 3: 提交**

```bash
git add -A
git commit -m "refactor: remove CategoryRepository and CategoryService"
```

---

## Task 9: 数据库迁移

**Step 1: 添加 SQL 迁移脚本**

在 `film-backend/migrations/` 下创建迁移文件（如果项目有迁移目录）。

**Step 2: 执行迁移**

删除 `prompt_category` 表，将 `prompt` 表的 `category_id` 列改为 `category_key` (varchar)。

**Step 3: 提交**

```bash
git add film-backend/migrations/
git commit -m "migrate: remove prompt_category table, rename category_id to category_key"
```

---

## Task 10: 验证构建

**Step 1: 运行构建验证**

```bash
cd film-backend && go build ./...
```

**Step 2: 如有编译错误，修复后提交**

---

## 执行选项

**Plan complete and saved to `docs/plans/2025-05-06-prompt-category-constant-design.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**