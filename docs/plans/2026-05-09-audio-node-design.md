# AudioNode 设计文档

## 概述

AudioNode 是一个支持音频处理的画布节点，同时具备 TTS（文本转语音）生成和音频文件上传预览功能。

## 功能模式

### 1. Prompt 模式（生成模式）
- 从上游节点（如 TextNode）接收文本内容
- 支持浮动面板输入 prompt
- 选择 TTS 音色（voice）
- 调用 TTS API 生成音频
- 生成完成后显示音频播放器

### 2. Upload 模式（上传模式）
- 支持拖拽上传、粘贴上传、点击上传
- 支持 MP3、WAV、OGG 等常见音频格式
- 上传后显示音频播放器预览
- 音频 URL 可传递给下游节点

## 数据模型

### AudioNodeData 接口
```typescript
export interface AudioNodeData extends NodeDisplayData {
  content: string;              // 来自上游节点的文本内容
  prompt: string;               // TTS 生成提示词
  audioUrl: string | null;       // 生成或上传的音频 URL
  previewAudioUrl: string | null;
  sourceFileName: string;        // 源文件名
  voice: string;                 // TTS 音色
  mode: 'prompt' | 'upload';   // 当前模式
  taskStatus: TaskStatus;
  taskProgress: number;
  taskId?: string;
  errorMessage?: string;
  fileSize?: number;
}
```

## 节点连接性

- **Target Handle (左侧)**：接收上游节点（如 TextNode）的文本内容
- **Source Handle (右侧)**：向下游节点（如 VideoGenNode）传递音频 URL

## API 集成

### 前端 API
| 操作 | API |
|------|-----|
| TTS 生成 | `POST /projects/:projectId/audio/generate` |
| 获取模型 | `GET /projects/:projectId/audio/models` |
| 获取音色 | `GET /projects/:projectId/audio/voices` |
| 查询任务 | `GET /projects/:projectId/audio/task` |
| 文件上传 | `POST /projects/:projectId/canvas/files/upload` |

### 后端路由
| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/projects/:projectId/audio/generate` | 创建 TTS 生成任务 |
| GET | `/projects/:projectId/audio/models` | 获取可用 TTS 模型 |
| GET | `/projects/:projectId/audio/voices` | 获取可用音色列表 |
| GET | `/projects/:projectId/audio/task` | 查询任务状态 |

## 文件变更清单

### 前端
| 文件 | 操作 |
|------|------|
| `domain/canvasNodes.ts` | 新增 `AudioNodeData` 接口，添加 `CANVAS_NODE_TYPES.audio` |
| `domain/nodeRegistry.ts` | 新增 `audioNodeDefinition` |
| `nodes/index.tsx` | 导入并注册 `AudioNode` |
| `nodes/AudioNode.tsx` | 新建 AudioNode 组件 |
| `api/audioApi.ts` | 新建音频相关 API |

### 后端
| 文件 | 操作 |
|------|------|
| `internal/handler/ai_audio.go` | 新建 AIAudioHandler |
| `internal/service/ai_audio/service.go` | 新建 ai_audio Service |
| `internal/ai/ai_audio.go` | 新建 AiAudioService |
| `internal/handler/handler.go` | 添加 AIAudioHandler 字段 |
| `internal/handler/router.go` | 注册 AIAudioHandler 路由 |
| `cmd/server/main.go` | 添加依赖注入 |
| `internal/model/media_task.go` | 确保 MediaTypeAudio 支持 |
