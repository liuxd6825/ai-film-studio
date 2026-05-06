# AI Film Studio - Agent 指南

## 项目结构

AI 视频生成平台，含三个独立子项目：

| 目录 | 技术栈 | 端口 |
|------|--------|------|
| `film-backend/` | Go 1.26 + Iris + SQLite | 17781 |
| `film-frontend/` | React + TypeScript + Vite + Ant Design | 5173 |
| `film-web-auto/` | Python 3.13 + FastAPI + Playwright | 18001 |

## 交流语言

所有交流必须使用**中文**。

## 启动命令

```bash
# film-backend
cd film-backend && go run ./cmd/server/main.go --config config.json

# film-frontend
cd film-frontend && npm run dev

# film-web-auto (使用 conda 环境)
cd film-web-auto && python main.py
```

## 配置

- 后端配置：`film-backend/configs/config.yaml`（LLM providers、API keys）
- web-auto 配置：`film-web-auto/config/config.yaml`（浏览器、数据库）
- 环境变量模板：`film-backend/.env.example`

## 依赖管理

- Go: `go.mod` / `go.sum`
- 前端: `npm` (package.json)
- Python: `requirements.txt`，使用 **conda** 管理环境

## 关键架构

- 后端使用 `cloudwego/eino` 框架调用 LLM，支持 ark/google/ollama/minimax 等 providers
- film-web-auto 通过 Playwright 控制浏览器操作 AI 平台（即通过浏览器调用各大 AI 平台生成图片与视频）
- 后端使用 SQLite，web-auto 使用 PostgreSQL

## 前端开发

```bash
# 类型检查
cd film-frontend && npx tsc --noEmit

# 验证命令顺序：lint -> typecheck -> test
```

## 知识库

常见问题和解决方案保存在 `docs/knowledge/` 目录下：
- `textnode-chinese-input-fix.md` - TextNode 中文输入问题解决方案

## 组件开发注意事项

### NodeTextarea 组件

位于 `src/features/canvas/components/NodeTextarea.tsx`，用于画布节点中的文本输入：
- 自动处理 `nodrag nowheel` CSS 类
- 自动阻止 `onMouseMove` 和 `onMouseDown` 事件冒泡
- 使用 `forwardRef` 转发 ref

### TextNode 中文输入

Content 输入框和浮窗 Prompt 输入框必须使用**独立的 ref**，避免 composition 事件冲突：
```typescript
const textareaRef = useRef<HTMLTextAreaElement>(null);      // Prompt 输入框
const contentTextareaRef = useRef<HTMLTextAreaElement>(null);  // Content 输入框
```

### API 调用

后端 API 使用 RESTful 风格，路径参数使用 `:id` 格式，如 `/projects/:projectId/llm/generate`。
