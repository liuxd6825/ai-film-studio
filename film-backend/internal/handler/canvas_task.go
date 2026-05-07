package handler

import (
	"log"
	"open-film-service/internal/ai"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/model"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/repository"
	"open-film-service/internal/service/canvas_task"

	"github.com/kataras/iris/v12"
)

type CanvasTaskHandler struct {
	taskSvc              *canvas_task.Service
	videoService         *ai.AiVideoService
	imageService         *ai.AiImageService
	canvasTaskResultRepo *repository.CanvasTaskResultRepository
}

func NewCanvasTaskHandler(svc *canvas_task.Service, videoService *ai.AiVideoService, imageService *ai.AiImageService, canvasTaskResultRepo *repository.CanvasTaskResultRepository) *CanvasTaskHandler {
	return &CanvasTaskHandler{
		taskSvc:              svc,
		videoService:         videoService,
		imageService:         imageService,
		canvasTaskResultRepo: canvasTaskResultRepo,
	}
}

func (h *CanvasTaskHandler) CreateTask(taskId, projectID, canvasID, nodeID string, taskType aioptions.TaskType, provider, model, prompt string, params map[string]interface{}) (*model.CanvasTask, error) {
	return h.taskSvc.CreateTask(canvas_task.CreateTaskRequest{
		TaskId:    taskId,
		ProjectID: projectID,
		CanvasID:  canvasID,
		NodeID:    nodeID,
		ResultID:  taskId,
		TaskType:  taskType.String(),
		Provider:  provider,
		Model:     model,
		Prompt:    prompt,
		Params:    params,
	})
}

func (h *CanvasTaskHandler) GetTask(ctx iris.Context) {
	taskID := ctx.Params().GetString("taskId")
	projectID := ctx.Params().GetString("projectId")

	task, err := h.taskSvc.GetTask(taskID)
	if err != nil {
		validator.NotFoundError(ctx, "task not found")
		return
	}

	if task.ProjectID != projectID {
		validator.NotFoundError(ctx, "task not found")
		return
	}

	validator.Success(ctx, task)
}

func (h *CanvasTaskHandler) PollTask(ctx iris.Context) {
	taskID := ctx.Params().GetString("taskId")
	if task, err := h.taskSvc.PollTask(ctx, taskID); err != nil {
		validator.InternalServerError(ctx, err)
		return
	} else {
		validator.Success(ctx, iris.Map{
			"id":           task.ID,
			"canvasId":     task.CanvasID,
			"nodeId":       task.NodeID,
			"projectId":    task.ProjectID,
			"taskType":     task.TaskType,
			"provider":     task.Provider,
			"model":        task.Model,
			"prompt":       task.Prompt,
			"status":       task.Status,
			"statusText":   task.Status.String(),
			"resultUrl":    task.ResultURL,
			"errorMessage": task.ErrorMessage,
			"progress":     0,
			"createdAt":    task.CreatedAt,
			"updatedAt":    task.UpdatedAt,
		})
	}
}

func (h *CanvasTaskHandler) CancelTask(ctx iris.Context) {
	taskID := ctx.Params().GetString("taskId")
	projectID := ctx.Params().GetString("projectId")

	task, err := h.taskSvc.GetTask(taskID)
	if err != nil {
		validator.NotFoundError(ctx, "task not found")
		return
	}

	if task.ProjectID != projectID {
		validator.NotFoundError(ctx, "task not found")
		return
	}

	if err := h.taskSvc.CancelTask(taskID); err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	task, _ = h.taskSvc.GetTask(taskID)
	validator.Success(ctx, task)
}

func (h *CanvasTaskHandler) GetTaskResults(ctx iris.Context) {
	taskID := ctx.Params().GetString("taskId")
	projectID := ctx.Params().GetString("projectId")

	task, err := h.taskSvc.GetTask(taskID)
	if err != nil {
		log.Printf("GetTask error: taskID=%s, err=%v", taskID, err)
		validator.NotFoundError(ctx, "task not found")
		return
	}

	if task.ProjectID != projectID {
		validator.NotFoundError(ctx, "task not found")
		return
	}

	results, err := h.canvasTaskResultRepo.GetByTaskID(taskID)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	validator.Success(ctx, results)
}

func (h *CanvasTaskHandler) GetNodeTaskImages(ctx iris.Context) {
	nodeID := ctx.Params().GetString("nodeId")

	page := ctx.URLParamIntDefault("page", 1)
	pageSize := ctx.URLParamIntDefault("pageSize", 10)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 10
	}

	result, err := h.taskSvc.ListNodeTaskImages(ctx, nodeID, page, pageSize)
	if err != nil {
		log.Printf("GetNodeTaskImages error: nodeID=%s, err=%v", nodeID, err)
		validator.InternalServerError(ctx, err)
		return
	}

	validator.Success(ctx, result)
}

func (h *CanvasTaskHandler) GetNodeTaskImagesCount(ctx iris.Context) {
	nodeID := ctx.Params().GetString("nodeId")

	count, err := h.taskSvc.CountNodeTaskImages(nodeID)
	if err != nil {
		log.Printf("GetNodeTaskImagesCount error: nodeID=%s, err=%v", nodeID, err)
		validator.InternalServerError(ctx, err)
		return
	}

	validator.Success(ctx, iris.Map{"count": count})
}
