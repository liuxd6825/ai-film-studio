package handler

import (
	"github.com/kataras/iris/v12"
)

func NewRouter(h *Handler) *iris.Application {
	app := iris.New()

	app.Use(func(ctx iris.Context) {
		ctx.Header("Access-Control-Allow-Origin", "*")
		ctx.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		ctx.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		ctx.Header("Access-Control-Allow-Credentials", "true")
		ctx.Next()
	})

	app.Options("/{p:path}", func(ctx iris.Context) {
		ctx.StatusCode(204)
	})

	app.Get("/health", h.Health)

	api := app.Party("/api/v1")
	{
		api.Options("/*any", func(ctx iris.Context) {
			ctx.StatusCode(204)
		})

		api.Post("/auth/login", h.Auth.Login)
		api.Post("/orgs", h.Org.Create)
		api.Get("/orgs", h.Org.List)
		api.Get("/orgs/:id", h.Org.Get)
		api.Put("/orgs/:id", h.Org.Update)

		api.Post("/orgs/:org_id/projects", h.Project.Create)
		api.Get("/orgs/:org_id/projects", h.Project.List)
		api.Get("/projects/:id", h.Project.Get)
		api.Put("/projects/:id", h.Project.Update)
		api.Delete("/projects/:id", h.Project.Delete)
		api.Delete("/orgs/:org_id/projects/:id", h.Project.Delete)

		// Canvas 路由
		api.Get("/projects/:projectId/canvases", h.Canvas.List)
		api.Post("/projects/:projectId/canvases", h.Canvas.Create)
		api.Get("/projects/:projectId/canvases/:canvasId", h.Canvas.Get)
		api.Put("/projects/:projectId/canvases/:canvasId", h.Canvas.Update)
		api.Delete("/projects/:projectId/canvases/:canvasId", h.Canvas.Delete)
		api.Put("/projects/:projectId/canvases/:canvasId/save", h.Canvas.Save)

		// 兼容旧版 Canvas 路由
		api.Get("/projects/:projectId/canvas", h.Canvas.GetByProject)
		api.Put("/projects/:projectId/canvas", h.Canvas.SaveByProject)

		// Canvas File 上传路由
		api.Post("/projects/:projectId/canvas/files/upload", h.CanvasFile.Upload)
		api.Get("/projects/:projectId/canvas/files/count", h.CanvasFile.GetNodeFileCount)
		api.Get("/projects/:projectId/canvas/:canvasId/files/:fileId/download", h.CanvasFile.Download)

		// Canvas Task 路由
		api.Get("/projects/:projectId/canvas/tasks/:taskId", h.CanvasTask.GetTask)
		api.Post("/projects/:projectId/canvas/tasks/:taskId/poll", h.CanvasTask.PollTask)
		api.Post("/projects/:projectId/canvas/tasks/:taskId/cancel", h.CanvasTask.CancelTask)
		api.Get("/projects/:projectId/canvas/tasks/:taskId/results", h.CanvasTask.GetTaskResults)
		api.Get("/projects/:projectId/canvas/nodes/:nodeId/task-images", h.CanvasTask.GetNodeTaskImages)
		api.Get("/projects/:projectId/canvas/nodes/:nodeId/task-images/count", h.CanvasTask.GetNodeTaskImagesCount)

		// AI LLM 生成路由
		h.LLMHandler.InitHandler(api)

		// AI Image 生成路由
		h.AIImageHandler.InitHandler(api)

		// AI 视频生成路由
		api.Post("/projects/:projectId/videos/generate", h.AIVideoHandler.Generate)
		api.Get("/projects/:projectId/videos/models", h.AIVideoHandler.GetModels)
		api.Get("/projects/:projectId/videos/task", h.AIVideoHandler.GetTask)

		api.Get("/styles", h.Style.List)
		api.Post("/styles", h.Style.Create)
		api.Put("/styles/:id", h.Style.Update)
		api.Delete("/styles/:id", h.Style.Delete)

		api.Get("/projects/:project_id/folders", h.Folder.List)
		api.Post("/projects/:project_id/folders", h.Folder.Create)
		api.Get("/folders/:id", h.Folder.Get)
		api.Put("/folders/:id", h.Folder.Update)
		api.Delete("/folders/:id", h.Folder.Delete)

		api.Get("/projects/:project_id/documents", h.Document.List)
		api.Post("/projects/:project_id/documents", h.Document.Create)
		api.Get("/documents/:id", h.Document.Get)
		api.Put("/documents/:id", h.Document.Update)
		api.Delete("/documents/:id", h.Document.Delete)

		api.Get("/projects/:project_id/files", h.FileAPI.List)
		api.Post("/projects/:project_id/files", h.FileAPI.Create)
		api.Post("/projects/:project_id/files/upload", h.FileAPI.Upload)
		api.Get("/files/:id", h.FileAPI.Get)
		api.Put("/files/:id", h.FileAPI.Update)
		api.Delete("/files/:id", h.FileAPI.Delete)
		api.Get("/files/:id/download", h.FileAPI.Download)

		api.Post("/projects/:project_id/keys", h.Keys.Create)
		api.Get("/projects/:project_id/keys", h.Keys.List)
		api.Delete("/projects/:project_id/keys/:id", h.Keys.Delete)

		api.Post("/projects/:project_id/models", h.Models.Create)
		api.Get("/projects/:project_id/models", h.Models.List)
		api.Put("/projects/:project_id/models/:id", h.Models.Update)
		api.Delete("/projects/:project_id/models/:id", h.Models.Delete)

		api.Post("/chat", h.Chat.Chat)
		api.Post("/chat/sync", h.Chat.ChatSync)
		api.Post("/chat/stream", h.ChatStream.ChatMessage)
		api.Post("/chat/sessions", h.ChatSession.CreateSession)
		api.Get("/chat/sessions", h.ChatSession.ListSessions)
		api.Delete("/chat/sessions/:id", h.ChatSession.DeleteSession)

		api.Post("/agents/:agent_id/conversations", h.ChatSession.CreateConversation)
		api.Get("/agents/:agent_id/conversations", h.ChatSession.ListConversations)
		api.Get("/conversations/:id", h.ChatSession.GetConversation)
		api.Post("/conversations/:id/messages", h.Chat.SendMessage)
		api.Get("/conversations/:id/messages", h.Chat.GetMessages)

		h.Agent.RegisterRoutes(api)

		api.Post("/projects/:project_id/skills", h.Skill.Create)
		api.Get("/projects/:project_id/skills", h.Skill.List)
		api.Put("/skills/:id", h.Skill.Update)
		api.Delete("/skills/:id", h.Skill.Delete)

		api.Get("/projects/:project_id/memory/:session_id", h.Memory.GetMemory)
		api.Delete("/projects/:project_id/memory/:id", h.Memory.DeleteMemory)

		api.Post("/projects/:project_id/media-tasks", h.Media.Create)
		api.Get("/projects/:project_id/media-tasks", h.Media.List)
		api.Get("/media-tasks/:id", h.Media.Get)

		api.Post("/audio/synthesize", h.Audio.Synthesize)

		// 字典表路由
		api.Get("/orgs/:org_id/dictionaries", h.Dictionary.List)
		api.Post("/orgs/:org_id/dictionaries", h.Dictionary.Create)
		api.Get("/dictionaries/:id", h.Dictionary.Get)
		api.Put("/dictionaries/:id", h.Dictionary.Update)
		api.Delete("/dictionaries/:id", h.Dictionary.Delete)

		// 角色路由
		api.Get("/projects/:project_id/characters", h.Character.List)
		api.Post("/projects/:project_id/characters", h.Character.Create)
		api.Get("/characters/:id", h.Character.Get)
		api.Put("/characters/:id", h.Character.Update)
		api.Delete("/characters/:id", h.Character.Delete)

		// 场景路由
		api.Get("/projects/:project_id/scenes", h.Scene.List)
		api.Post("/projects/:project_id/scenes", h.Scene.Create)
		api.Get("/scenes/:id", h.Scene.Get)
		api.Put("/scenes/:id", h.Scene.Update)
		api.Delete("/scenes/:id", h.Scene.Delete)

		// 道具路由
		api.Get("/projects/:project_id/props", h.Prop.List)
		api.Post("/projects/:project_id/props", h.Prop.Create)
		api.Get("/props/:id", h.Prop.Get)
		api.Put("/props/:id", h.Prop.Update)
		api.Delete("/props/:id", h.Prop.Delete)

		// 视觉图路由
		api.Get("/projects/:project_id/visual_images", h.VisualImage.List)
		api.Post("/projects/:project_id/visual_images", h.VisualImage.Create)
		api.Get("/visual_images/:id", h.VisualImage.Get)
		api.Put("/visual_images/:id", h.VisualImage.Update)
		api.Delete("/visual_images/:id", h.VisualImage.Delete)
		api.Put("/visual_images/:id/cover", h.VisualImage.SetCover)

		// 生图会话路由
		api.Get("/projects/:project_id/image_sessions", h.ImageSession.List)
		api.Post("/projects/:project_id/image_sessions", h.ImageSession.Create)
		api.Get("/image_sessions/:id", h.ImageSession.Get)
		api.Delete("/image_sessions/:id", h.ImageSession.Delete)

		// 看板路由
		boards := api.Party("/projects/:project_id/boards")
		{
			boards.Get("/", h.Board.ListBoards)
			boards.Post("/", h.Board.CreateBoard)
			boards.Get("/:board_id/story_pages", h.Board.ListStoryPages)
			boards.Post("/:board_id/story_pages", h.Board.CreateStoryPage)
		}

		// 故事页路由
		api.Get("/projects/:project_id/story_pages", h.StoryPage.List)
		api.Post("/projects/:project_id/story_pages", h.StoryPage.Create)
		api.Get("/story_pages/:id", h.StoryPage.Get)
		api.Put("/story_pages/:id", h.StoryPage.Update)
		api.Delete("/story_pages/:id", h.StoryPage.Delete)
		api.Post("/story_pages/:id/analyze", h.StoryPage.Analyze)

		// 镜头路由
		api.Get("/projects/:project_id/story_pages/:story_page_id/shots", h.Shot.List)
		api.Post("/projects/:project_id/story_pages/:story_page_id/shots", h.Shot.Create)
		api.Post("/projects/:project_id/story_pages/:story_page_id/shots/batch", h.Shot.CreateBatch)
		api.Post("/shots/generate_from_script", h.Shot.GenerateFromScript)
		api.Get("/shots/:id", h.Shot.Get)
		api.Put("/shots/:id", h.Shot.Update)
		api.Delete("/shots/batch", h.Shot.DeleteBatch)
		api.Delete("/shots/:id", h.Shot.Delete)

		// 关键帧路由
		api.Get("/shots/:shot_id/keyframes", h.Keyframe.List)
		api.Post("/shots/:shot_id/keyframes", h.Keyframe.Create)
		api.Post("/shots/:shot_id/keyframes/generate", h.Keyframe.AIGenerateFromShotScript)
		api.Get("/keyframes/:id", h.Keyframe.Get)
		api.Put("/keyframes/:id", h.Keyframe.Update)
		api.Delete("/keyframes/:id", h.Keyframe.Delete)
		api.Put("/keyframes/batch", h.Keyframe.BatchUpdate)

		api.Post("/projects/:project_id/video-tasks", h.Video.Create)
		api.Get("/video-tasks/:id", h.Video.Get)

		api.Post("/projects/:project_id/comfy/workflows", h.Comfy.Create)
		api.Get("/projects/:project_id/comfy/workflows", h.Comfy.List)
		api.Get("/comfy/workflows/:id", h.Comfy.Get)
		api.Put("/comfy/workflows/:id", h.Comfy.Update)
		api.Delete("/comfy/workflows/:id", h.Comfy.Delete)
		api.Post("/comfy/workflows/:id/execute", h.Comfy.Execute)
		api.Get("/comfy/executions/:id", h.Comfy.GetExecution)

		// Prompt 路由
		api.Get("/prompts", h.Prompt.List)
		api.Post("/prompts", h.Prompt.Create)
		api.Get("/prompts/:id", h.Prompt.Get)
		api.Put("/prompts/:id", h.Prompt.Update)
		api.Delete("/prompts/:id", h.Prompt.Delete)
		api.Get("/prompts/:id/versions", h.Prompt.GetVersions)
		api.Post("/prompts/:id/restore/:version", h.Prompt.RestoreVersion)

		// Prompt Category 路由
		api.Get("/prompt-categories", h.Category.List)

		// 按分类查询提示词（包含系统提示词，无 content）
		api.Get("/prompt-category/:categoryKey/prompts", h.PromptAdmin.ListByCategory)

		// Admin Prompt 路由（包含系统提示词）
		adminPrompts := api.Party("/admin/prompts")
		{
			adminPrompts.Get("/", h.PromptAdmin.List)
			adminPrompts.Post("/", h.PromptAdmin.Create)
			adminPrompts.Get("/:id", h.PromptAdmin.Get)
			adminPrompts.Put("/:id", h.PromptAdmin.Update)
			adminPrompts.Delete("/:id", h.PromptAdmin.Delete)
			adminPrompts.Get("/:id/versions", h.PromptAdmin.GetVersions)
			adminPrompts.Post("/:id/restore/:version", h.PromptAdmin.RestoreVersion)
		}
	}

	return app
}
