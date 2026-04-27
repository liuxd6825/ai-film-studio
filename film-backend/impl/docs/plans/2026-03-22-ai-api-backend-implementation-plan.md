# AI API Backend Service Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建完整的 AI API 后台服务，支持多租户、聊天、Agent、Skill、记忆、图片/视频生成、ComfyUI 集成

**Architecture:** 模块化插件架构，基于 cloudwego/eino AI 框架，通过 Iris 提供 HTTP API，数据持久化使用 GORM

**Tech Stack:** Go, Iris, GORM, cloudwego/eino, spf13/afero

---

## Task 1: 项目初始化

**Files:**
- Create: `go.mod`
- Create: `cmd/server/main.go`
- Create: `internal/config/config.go`

**Step 1: 创建 go.mod**

```bash
cd open-film-service && go mod init open-film-service
```

**Step 2: 创建目录结构**

```bash
mkdir -p cmd/server internal/{config,model,repository,service/{org,project,chat,agent,skill,memory,image,video,comfy},handler,middleware,plugin/{model,provider}} pkg/afero docs/plans
```

**Step 3: 创建 main.go**

```go
package main

import (
    "log"
    "github.com/kataras/iris/v12"
    "open-film-service/internal/config"
    "open-film-service/internal/handler"
    "open-film-service/internal/middleware"
)

func main() {
    cfg := config.Load()
    
    app := iris.New()
    
    // Middleware
    app.Use(middleware.Auth())
    app.Use(middleware.Logger())
    
    // Routes
    h := handler.NewHandler(cfg)
    registerRoutes(app, h)
    
    app.Listen(cfg.ServerAddr)
}
```

**Step 4: 创建 config.go**

```go
package config

type Config struct {
    ServerAddr string
    DB         DBConfig
}

type DBConfig struct {
    DSN string
}

func Load() *Config {
    return &Config{
        ServerAddr: ":8080",
        DB: DBConfig{
            DSN: "sqlite.db",
        },
    }
}
```

---

## Task 2: 数据库模型

**Files:**
- Create: `internal/model/org.go`
- Create: `internal/model/project.go`
- Create: `internal/model/api_key.go`
- Create: `internal/model/model_cfg.go`
- Create: `internal/model/skill.go`
- Create: `internal/model/agent.go`
- Create: `internal/model/memory.go`
- Create: `internal/model/conversation.go`
- Create: `internal/model/chat_message.go`
- Create: `internal/model/comfy_workflow.go`
- Create: `internal/model/image_task.go`
- Create: `internal/model/video_task.go`
- Create: `internal/model/init.go`

**Step 1: 创建 org.go**

```go
package model

import (
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type Org struct {
    ID        uuid.UUID `gorm:"type:char(36);primaryKey"`
    Name      string    `gorm:"size:255;not null"`
    Status    int       `gorm:"default:1"`
    CreatedAt int64     `gorm:"autoCreateTime"`
    UpdatedAt int64     `gorm:"autoUpdateTime"`
}

func (Org) TableName() string {
    return "org"
}
```

(其他模型类似，创建完整的 GORM 模型定义)

---

## Task 3: Repository 层

**Files:**
- Create: `internal/repository/org.go`
- Create: `internal/repository/project.go`
- Create: `internal/repository/api_key.go`
- Create: `internal/repository/model_cfg.go`
- Create: `internal/repository/agent.go`
- Create: `internal/repository/skill.go`
- Create: `internal/repository/memory.go`
- Create: `internal/repository/conversation.go`
- Create: `internal/repository/chat_message.go`
- Create: `internal/repository/comfy_workflow.go`
- Create: `internal/repository/image_task.go`
- Create: `internal/repository/video_task.go`

**Step 1: 创建 org.go**

```go
package repository

import (
    "gorm.io/gorm"
    "open-film-service/internal/model"
)

type OrgRepository struct {
    db *gorm.DB
}

func NewOrgRepository(db *gorm.DB) *OrgRepository {
    return &OrgRepository{db: db}
}

func (r *OrgRepository) Create(org *model.Org) error {
    return r.db.Create(org).Error
}

func (r *OrgRepository) GetByID(id string) (*model.Org, error) {
    var org model.Org
    err := r.db.Where("id = ?", id).First(&org).Error
    if err != nil {
        return nil, err
    }
    return &org, nil
}

func (r *OrgRepository) List() ([]model.Org, error) {
    var orgs []model.Org
    err := r.db.Find(&orgs).Error
    return orgs, err
}
```

---

## Task 4: Service 层

**Files:**
- Create: `internal/service/org/service.go`
- Create: `internal/service/project/service.go`
- Create: `internal/service/chat/service.go`
- Create: `internal/service/agent/service.go`
- Create: `internal/service/skill/service.go`
- Create: `internal/service/memory/service.go`
- Create: `internal/service/image/service.go`
- Create: `internal/service/video/service.go`
- Create: `internal/service/comfy/service.go`

**Step 1: 创建 org/service.go**

```go
package org

import (
    "open-film-service/internal/model"
    "open-film-service/internal/repository"
)

type Service struct {
    repo *repository.OrgRepository
}

func NewService(repo *repository.OrgRepository) *Service {
    return &Service{repo: repo}
}

func (s *Service) Create(name string) (*model.Org, error) {
    org := &model.Org{
        Name: name,
    }
    if err := s.repo.Create(org); err != nil {
        return nil, err
    }
    return org, nil
}

func (s *Service) GetByID(id string) (*model.Org, error) {
    return s.repo.GetByID(id)
}
```

---

## Task 5: Handler 层

**Files:**
- Create: `internal/handler/org.go`
- Create: `internal/handler/project.go`
- Create: `internal/handler/chat.go`
- Create: `internal/handler/agent.go`
- Create: `internal/handler/skill.go`
- Create: `internal/handler/memory.go`
- Create: `internal/handler/image.go`
- Create: `internal/handler/video.go`
- Create: `internal/handler/comfy.go`
- Create: `internal/handler/router.go`

**Step 1: 创建 org.go**

```go
package handler

import (
    "github.com/kataras/iris/v12"
    "open-film-service/internal/service/org"
)

type OrgHandler struct {
    svc *org.Service
}

func NewOrgHandler(svc *org.Service) *OrgHandler {
    return &OrgHandler{svc: svc}
}

func (h *OrgHandler) Create(ctx iris.Context) {
    var req struct {
        Name string `json:"name"`
    }
    if err := ctx.ReadJSON(&req); err != nil {
        ctx.StatusCode(400)
        ctx.JSON(iris.Map{"error": err.Error()})
        return
    }
    
    org, err := h.svc.Create(req.Name)
    if err != nil {
        ctx.StatusCode(500)
        ctx.JSON(iris.Map{"error": err.Error()})
        return
    }
    
    ctx.StatusCode(201)
    ctx.JSON(org)
}
```

---

## Task 6: Middleware

**Files:**
- Create: `internal/middleware/auth.go`
- Create: `internal/middleware/logger.go`
- Create: `internal/middleware/ratelimit.go`

**Step 1: 创建 auth.go**

```go
package middleware

import (
    "github.com/kataras/iris/v12"
)

func Auth() iris.Handler {
    return func(ctx iris.Context) {
        apiKey := ctx.GetHeader("X-API-Key")
        if apiKey == "" {
            ctx.StatusCode(401)
            ctx.JSON(iris.Map{"error": "missing API key"})
            ctx.StopExecution()
            return
        }
        
        // Validate API key from DB
        ctx.Values().Set("api_key", apiKey)
        ctx.Next()
    }
}
```

---

## Task 7: 插件层 - Model 适配器

**Files:**
- Create: `internal/plugin/model/adapter.go`
- Create: `internal/plugin/model/openai.go`
- Create: `internal/plugin/model/anthropic.go`
- Create: `internal/plugin/provider/registry.go`

**Step 1: 创建 adapter.go**

```go
package model

import (
    "context"
    "github.com/cloudwego/eino"
)

type ModelAdapter interface {
    Generate(ctx context.Context, messages []*eino.Message) (string, error)
    Stream(ctx context.Context, messages []*eino.Message) (<-chan string, error)
}

type ModelRegistry struct {
    adapters map[string]ModelAdapter
}

func NewRegistry() *ModelRegistry {
    return &Registry{
        adapters: make(map[string]ModelAdapter),
    }
}

func (r *Registry) Register(name string, adapter ModelAdapter) {
    r.adapters[name] = adapter
}

func (r *Registry) Get(name string) (ModelAdapter, bool) {
    adapter, ok := r.adapters[name]
    return adapter, ok
}
```

---

## Task 8: Skill 引擎

**Files:**
- Create: `internal/service/skill/engine.go`
- Create: `internal/service/skill/types.go`

**Step 1: 创建 engine.go**

```go
package skill

import (
    "context"
)

type SkillResult struct {
    Name      string
    Output    string
    Artifacts map[string]interface{}
    Error     error
}

type SkillEngine struct {
    skills map[string]Skill
}

func NewEngine() *SkillEngine {
    return &SkillEngine{
        skills: make(map[string]Skill),
    }
}

func (e *SkillEngine) Register(skill Skill) {
    e.skills[skill.Name()] = skill
}

func (e *SkillEngine) Execute(ctx context.Context, name string, params map[string]interface{}) (*SkillResult, error) {
    skill, ok := e.skills[name]
    if !ok {
        return nil, ErrSkillNotFound
    }
    
    output, err := skill.Run(ctx, params)
    return &SkillResult{
        Name:      name,
        Output:    output,
        Artifacts: skill.Artifacts(),
    }, err
}
```

---

## Task 9: Memory 管理器

**Files:**
- Create: `internal/service/memory/manager.go`

**Step 1: 创建 manager.go**

```go
package memory

import (
    "open-film-service/internal/model"
    "open-film-service/internal/repository"
)

type Manager struct {
    repo *repository.MemoryRepository
}

func NewManager(repo *repository.MemoryRepository) *Manager {
    return &Manager{repo: repo}
}

func (m *Manager) LoadSession(projectID, sessionID string) ([]*model.ChatMessage, error) {
    memory, err := m.repo.GetBySession(projectID, sessionID)
    if err != nil {
        return nil, err
    }
    return memory.Messages, nil
}

func (m *Manager) SaveSession(projectID, sessionID string, messages []*model.ChatMessage) error {
    memory := &model.Memory{
        ProjectID:  projectID,
        SessionID:  sessionID,
        Messages:   messages,
    }
    return m.repo.Upsert(memory)
}
```

---

## Task 10: Chat 服务

**Files:**
- Create: `internal/service/chat/service.go`
- Create: `internal/service/chat/stream.go`

**Step 1: 创建 service.go**

```go
package chat

import (
    "context"
    "open-film-service/internal/model"
    "open-film-service/internal/plugin/model"
)

type ChatService struct {
    modelAdapter model.ModelAdapter
    memoryMgr    *memory.Manager
}

func NewChatService(adapter model.ModelAdapter, memoryMgr *memory.Manager) *ChatService {
    return &ChatService{
        modelAdapter: adapter,
        memoryMgr:    memoryMgr,
    }
}

func (s *ChatService) Chat(ctx context.Context, req *ChatRequest) (*ChatResponse, error) {
    // 1. Load conversation history
    history, err := s.memoryMgr.LoadSession(req.ProjectID, req.SessionID)
    if err != nil {
        return nil, err
    }
    
    // 2. Build messages
    messages := buildMessages(history, req.Message)
    
    // 3. Call model
    response, err := s.modelAdapter.Generate(ctx, messages)
    if err != nil {
        return nil, err
    }
    
    // 4. Save to memory
    s.memoryMgr.SaveSession(req.ProjectID, req.SessionID, append(history, &model.ChatMessage{
        Role:    "user",
        Content: req.Message,
    }, &model.ChatMessage{
        Role:    "assistant",
        Content: response,
    }))
    
    return &ChatResponse{Response: response}, nil
}
```

---

## Task 11: ComfyUI 服务

**Files:**
- Create: `internal/service/comfy/client.go`
- Create: `internal/service/comfy/builder.go`
- Create: `internal/service/comfy/executor.go`

**Step 1: 创建 client.go**

```go
package comfy

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type Client struct {
    baseURL string
    client  *http.Client
}

func NewClient(baseURL string) *Client {
    return &Client{
        baseURL: baseURL,
        client:  &http.Client{},
    }
}

func (c *Client) ExecuteWorkflow(workflowJSON string) (string, error) {
    payload, _ := json.Marshal(map[string]string{
        "workflow": workflowJSON,
    })
    
    resp, err := c.client.Post(c.baseURL+"/api/execute", "application/json", bytes.NewBuffer(payload))
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    
    return result["prompt_id"].(string), nil
}
```

---

## Task 12: 路由注册

**Files:**
- Modify: `internal/handler/router.go`

**Step 1: 创建 router.go**

```go
package handler

import (
    "github.com/kataras/iris/v12"
)

func RegisterRoutes(app *iris.Application, h *Handler) {
    // Org routes
    app.Post("/api/v1/orgs", h.Org.Create)
    app.Get("/api/v1/orgs", h.Org.List)
    app.Get("/api/v1/orgs/:id", h.Org.Get)
    app.Put("/api/v1/orgs/:id", h.Org.Update)
    
    // Project routes
    app.Post("/api/v1/orgs/:org_id/projects", h.Project.Create)
    app.Get("/api/v1/orgs/:org_id/projects", h.Project.List)
    app.Get("/api/v1/projects/:id", h.Project.Get)
    app.Put("/api/v1/projects/:id", h.Project.Update)
    app.Delete("/api/v1/projects/:id", h.Project.Delete)
    
    // Chat routes
    app.Post("/api/v1/chat", h.Chat.Chat)
    app.Post("/api/v1/chat/sync", h.Chat.ChatSync)
    
    // Agent routes
    app.Post("/api/v1/projects/:project_id/agents", h.Agent.Create)
    app.Get("/api/v1/projects/:project_id/agents", h.Agent.List)
    app.Post("/api/v1/agents/:id/execute", h.Agent.Execute)
    
    // ... more routes
}
```

---

## 实施顺序

1. **Task 1**: 项目初始化 (go.mod, 目录结构, main.go, config)
2. **Task 2**: 数据库模型 (GORM models)
3. **Task 3**: Repository 层 (数据访问)
4. **Task 4**: Service 层 (业务逻辑)
5. **Task 5**: Handler 层 (HTTP handlers)
6. **Task 6**: Middleware (Auth, Logger)
7. **Task 7**: 插件层 - Model 适配器
8. **Task 8**: Skill 引擎
9. **Task 9**: Memory 管理器
10. **Task 10**: Chat 服务
11. **Task 11**: ComfyUI 服务
12. **Task 12**: 路由注册

**Plan saved to:** `docs/plans/2026-03-22-ai-api-backend-implementation-plan.md`
