# AI API Backend Service 设计文档

**日期**: 2026-03-22
**项目**: open-film-service

---

## 1. 项目概述

AI API 后台服务，支持多租户、多模型、多 Agent、记忆管理、Skill 管理、图片/视频生成、ComfyUI 工作流调用。

## 2. 技术栈

| 组件 | 技术 |
|------|------|
| 语言 | Go |
| HTTP 框架 | Iris |
| AI 框架 | github.com/cloudwego/eino |
| 数据库 | GORM |
| 文件操作 | spf13/afero |
| 认证 | API Key |

## 3. 目录结构

```
open-film-service/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── config/               # 配置管理
│   ├── model/                # GORM 数据模型
│   ├── repository/           # 数据访问层
│   ├── service/              # 业务逻辑层
│   │   ├── org/
│   │   ├── project/
│   │   ├── chat/
│   │   ├── agent/
│   │   ├── skill/
│   │   ├── memory/
│   │   ├── image/
│   │   ├── video/
│   │   └── comfy/
│   ├── handler/              # HTTP Handler (Iris)
│   ├── middleware/           # 中间件 (Auth, Log, RateLimit)
│   └── plugin/               # 插件实现
│       ├── model/            # 模型适配器 (eino)
│       └── provider/         # 第三方provider
├── pkg/
│   └── afero/                # 文件操作封装
├── docs/
│   └── plans/
├── go.mod
└── go.sum
```

## 4. 数据库模型

### 4.1 组织 (org)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | string | 组织名称 |
| status | int | 状态 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 4.2 项目 (project)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| org_id | uuid | 所属组织 |
| name | string | 项目名称 |
| description | string | 描述 |
| settings | json | 项目设置 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 4.3 API Key (api_key)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| org_id | uuid | 所属组织 |
| project_id | uuid | 所属项目 |
| key_hash | string | API Key 哈希 |
| name | string | Key 名称 |
| status | int | 状态 |
| last_used_at | timestamp | 最后使用时间 |
| expires_at | timestamp | 过期时间 |
| created_at | timestamp | 创建时间 |

### 4.4 模型配置 (model_cfg)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| project_id | uuid | 所属项目 |
| provider | string | Provider (openai/anthropic/google) |
| model_name | string | 模型名称 |
| api_key | string | 加密的 API Key |
| base_url | string | API 基础地址 |
| settings | json | 其他设置 |
| priority | int | 优先级 |
| created_at | timestamp | 创建时间 |

### 4.5 Skill (skill)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| project_id | uuid | 所属项目 |
| name | string | Skill 名称 |
| description | string | 描述 |
| type | string | 类型 |
| config | json | Skill 配置 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 4.6 Agent (agent)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| project_id | uuid | 所属项目 |
| name | string | Agent 名称 |
| description | string | 描述 |
| model_cfg_id | uuid | 使用的模型配置 |
| skills | json | 绑定的 Skills |
| instructions | string | 系统指令 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 4.7 记忆 (memory)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| project_id | uuid | 所属项目 |
| session_id | string | 会话 ID |
| messages | json | 消息历史 |
| metadata | json | 元数据 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 4.8 对话 (conversation)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| agent_id | uuid | 所属 Agent |
| title | string | 对话标题 |
| status | int | 状态 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 4.9 聊天消息 (chat_message)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| conversation_id | uuid | 所属对话 |
| role | string | 角色 (user/assistant/system) |
| content | text | 消息内容 |
| meta | json | 元数据 |
| created_at | timestamp | 创建时间 |

### 4.10 ComfyUI 工作流 (comfy_workflow)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| project_id | uuid | 所属项目 |
| name | string | 工作流名称 |
| description | string | 描述 |
| workflow_json | text | 工作流 JSON |
| input_schema | json | 输入 Schema |
| output_schema | json | 输出 Schema |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 4.11 图片任务 (image_task)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| project_id | uuid | 所属项目 |
| type | string | 类型 (dall/stable_diffusion) |
| prompt | text | 提示词 |
| params | json | 参数 |
| status | int | 状态 |
| result_url | string | 结果 URL |
| created_at | timestamp | 创建时间 |

### 4.12 视频任务 (video_task)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| project_id | uuid | 所属项目 |
| type | string | 类型 (sora/runway/pika) |
| prompt | text | 提示词 |
| params | json | 参数 |
| status | int | 状态 |
| result_url | string | 结果 URL |
| created_at | timestamp | 创建时间 |

## 5. API 路由

**认证**: X-API-Key Header

### 组织管理
- `POST /api/v1/orgs` - 创建组织
- `GET /api/v1/orgs` - 列出组织
- `GET /api/v1/orgs/:id` - 获取组织详情
- `PUT /api/v1/orgs/:id` - 更新组织

### 项目管理
- `POST /api/v1/orgs/:org_id/projects` - 创建项目
- `GET /api/v1/orgs/:org_id/projects` - 列出项目
- `GET /api/v1/projects/:id` - 获取项目详情
- `PUT /api/v1/projects/:id` - 更新项目
- `DELETE /api/v1/projects/:id` - 删除项目

### API Key 管理
- `POST /api/v1/projects/:project_id/keys` - 创建 API Key
- `GET /api/v1/projects/:project_id/keys` - 列出 Key
- `DELETE /api/v1/projects/:project_id/keys/:id` - 删除 Key

### 模型配置
- `POST /api/v1/projects/:project_id/models` - 添加模型配置
- `GET /api/v1/projects/:project_id/models` - 列出模型
- `PUT /api/v1/projects/:project_id/models/:id` - 更新模型
- `DELETE /api/v1/projects/:project_id/models/:id` - 删除模型

### Agent 管理
- `POST /api/v1/projects/:project_id/agents` - 创建 Agent
- `GET /api/v1/projects/:project_id/agents` - 列出 Agent
- `GET /api/v1/agents/:id` - 获取 Agent 详情
- `PUT /api/v1/agents/:id` - 更新 Agent
- `DELETE /api/v1/agents/:id` - 删除 Agent

### Skill 管理
- `POST /api/v1/projects/:project_id/skills` - 创建 Skill
- `GET /api/v1/projects/:project_id/skills` - 列出 Skill
- `PUT /api/v1/skills/:id` - 更新 Skill
- `DELETE /api/v1/skills/:id` - 删除 Skill

### 对话/记忆
- `POST /api/v1/agents/:agent_id/conversations` - 创建对话
- `GET /api/v1/agents/:agent_id/conversations` - 列出对话
- `GET /api/v1/conversations/:id` - 获取对话详情
- `POST /api/v1/conversations/:id/messages` - 发送消息
- `GET /api/v1/conversations/:id/messages` - 获取历史消息

### 聊天
- `POST /api/v1/chat` - 流式对话
- `POST /api/v1/chat/sync` - 同步对话

### 图片生成
- `POST /api/v1/projects/:project_id/image-tasks` - 创建图片任务
- `GET /api/v1/projects/:project_id/image-tasks/:id` - 获取任务状态

### 视频生成
- `POST /api/v1/projects/:project_id/video-tasks` - 创建视频任务
- `GET /api/v1/projects/:project_id/video-tasks/:id` - 获取任务状态

### ComfyUI
- `POST /api/v1/projects/:project_id/comfy/workflows` - 创建工作流
- `GET /api/v1/projects/:project_id/comfy/workflows` - 列出工作流
- `GET /api/v1/comfy/workflows/:id` - 获取工作流
- `PUT /api/v1/comfy/workflows/:id` - 更新工作流
- `DELETE /api/v1/comfy/workflows/:id` - 删除工作流
- `POST /api/v1/comfy/workflows/:id/execute` - 执行工作流
- `GET /api/v1/comfy/executions/:id` - 获取执行状态

## 6. 核心流程

### 6.1 Chat 消息流

1. Client 发送 POST /api/v1/chat (含 X-API-Key)
2. Auth Middleware 验证 API Key
3. 从 DB 加载 Agent 配置 + Skills + Model Config
4. Memory Manager 从 DB 加载 conversation history
5. 组装 messages (system prompt + history + user msg)
6. 调用 eino chatModel.Generate()
7. 保存用户消息到 DB
8. 流式/同步返回 AI 响应
9. 保存 AI 响应到 DB

### 6.2 Agent 执行流

1. 加载 Agent 配置 (model, skills, instructions)
2. 解析 task，决策使用哪些 Skill
3. Skill Engine 执行 Skills (可嵌套)
4. Memory Manager 自动存储上下文
5. 返回结果 { status, result, artifacts, memory_summary }

### 6.3 ComfyUI 集成

**动态工作流构建**:
1. 接收任务描述 / 参考图 / 参数
2. 调用 LLM 生成 ComfyUI workflow JSON
3. 验证 workflow 结构
4. 存储到 DB
5. 返回 workflow_id

**工作流执行**:
1. 加载 workflow JSON
2. 调用 ComfyUI API 提交执行
3. 轮询执行状态
4. 返回结果图片/视频 URL
5. 存储执行记录

## 7. 错误处理

| 错误类型 | HTTP 状态码 | 说明 |
|----------|-------------|------|
| 认证错误 | 401 | Invalid/Expired/Inactive API Key |
| 权限错误 | 403 | No permission to access resource |
| 资源错误 | 404 | Org/Project/Agent not found |
| 业务错误 | 400 | Invalid model config / execution failed |
| 限流错误 | 429 | Rate limit exceeded |
| 服务错误 | 500 | Internal server error |

## 8. 设计决策

- **多租户架构**: 组织 + 项目 (两级隔离)
- **认证方式**: API Key (适合服务端调用)
- **记忆存储**: GORM 数据库持久化
- **模型支持**: 文本 + 图片 + 视频 + ComfyUI
- **部署规模**: 小型 (<100 并发)
