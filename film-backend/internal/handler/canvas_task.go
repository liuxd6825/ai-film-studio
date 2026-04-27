package handler

import (
	"context"
	"log"

	"open-film-service/internal/model"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/repository"
	"open-film-service/internal/service/ai_jimeng"
	"open-film-service/internal/service/canvas_task"

	"github.com/kataras/iris/v12"
)

type CanvasTaskHandler struct {
	svc                  *canvas_task.Service
	jimengSvc            *ai_jimeng.Service
	canvasTaskResultRepo *repository.CanvasTaskResultRepository
}

func NewCanvasTaskHandler(svc *canvas_task.Service, jimengSvc *ai_jimeng.Service, canvasTaskResultRepo *repository.CanvasTaskResultRepository) *CanvasTaskHandler {
	return &CanvasTaskHandler{
		svc:                  svc,
		jimengSvc:            jimengSvc,
		canvasTaskResultRepo: canvasTaskResultRepo,
	}
}

func (h *CanvasTaskHandler) CreateTask(projectID, canvasID, nodeID, resultId, resultUrl, taskType, provider, model, prompt string, params map[string]interface{}) (*model.CanvasTask, error) {
	return h.svc.CreateTask(canvas_task.CreateTaskRequest{
		ProjectID: projectID,
		CanvasID:  canvasID,
		NodeID:    nodeID,
		ResultID:  resultId,
		ResultURL: resultUrl,
		TaskType:  taskType,
		Provider:  provider,
		Model:     model,
		Prompt:    prompt,
		Params:    params,
	})
}

func (h *CanvasTaskHandler) GetTask(ctx iris.Context) {
	taskID := ctx.Params().GetString("taskId")
	projectID := ctx.Params().GetString("projectId")

	task, err := h.svc.GetTask(taskID)
	if err != nil {
		validator.NotFoundError(ctx, "task not found")
		return
	}

	if task.ProjectID != projectID {
		validator.NotFoundError(ctx, "task not found")
		return
	}

	validator.Success(ctx, CanvasTaskStatus{
		ID:           task.ID,
		CanvasID:     task.CanvasID,
		NodeID:       task.NodeID,
		ProjectID:    task.ProjectID,
		TaskType:     task.TaskType,
		Provider:     task.Provider,
		Model:        task.Model,
		Prompt:       task.Prompt,
		Status:       task.Status,
		StatusText:   statusToText(task.Status),
		ResultURL:    task.ResultURL,
		ErrorMessage: task.ErrorMessage,
		Progress:     task.Progress,
		CreatedAt:    task.CreatedAt,
		UpdatedAt:    task.UpdatedAt,
	})
}

func (h *CanvasTaskHandler) PollTask(ctx iris.Context) {
	taskID := ctx.Params().GetString("taskId")
	projectID := ctx.Params().GetString("projectId")

	task, err := h.svc.GetTask(taskID)
	if err != nil {
		validator.NotFoundError(ctx, "task not found taskID is null")
		return
	}

	if task.Status > 1 {
		validator.Success(ctx, CanvasTaskStatus{
			ID:           task.ID,
			CanvasID:     task.CanvasID,
			NodeID:       task.NodeID,
			ProjectID:    task.ProjectID,
			TaskType:     task.TaskType,
			Provider:     task.Provider,
			Model:        task.Model,
			Prompt:       task.Prompt,
			Status:       task.Status,
			StatusText:   statusToText(task.Status),
			ResultId:     task.ResultID,
			ResultURL:    task.ResultURL,
			ErrorMessage: task.ErrorMessage,
			Progress:     task.Progress,
			CreatedAt:    task.CreatedAt,
			UpdatedAt:    task.UpdatedAt,
		})
		return
	}

	if task.ProjectID != projectID {
		validator.NotFoundError(ctx, "task not found projectID is null")
		return
	}

	if task.Provider == "jimeng" {
		workspace := ctx.URLParamDefault("workspace", "11117754646028")
		if err := h.svc.PollJimengResult(taskID, workspace); err != nil {
			validator.InternalServerError(ctx, err)
			return
		}
	}

	task, err = h.svc.GetTask(taskID)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	validator.Success(ctx, CanvasTaskStatus{
		ID:           task.ID,
		CanvasID:     task.CanvasID,
		NodeID:       task.NodeID,
		ProjectID:    task.ProjectID,
		TaskType:     task.TaskType,
		Provider:     task.Provider,
		Model:        task.Model,
		Prompt:       task.Prompt,
		Status:       task.Status,
		StatusText:   statusToText(task.Status),
		ResultId:     task.ResultID,
		ResultURL:    task.ResultURL,
		ErrorMessage: task.ErrorMessage,
		Progress:     task.Progress,
		CreatedAt:    task.CreatedAt,
		UpdatedAt:    task.UpdatedAt,
	})
}

func (h *CanvasTaskHandler) CompleteTask(ctx context.Context, taskID string, results []*model.CanvasTaskResult) error {
	return h.svc.CompleteTask(ctx, taskID, results)
}

func (h *CanvasTaskHandler) CancelTask(ctx iris.Context) {
	taskID := ctx.Params().GetString("taskId")
	projectID := ctx.Params().GetString("projectId")

	task, err := h.svc.GetTask(taskID)
	if err != nil {
		validator.NotFoundError(ctx, "task not found")
		return
	}

	if task.ProjectID != projectID {
		validator.NotFoundError(ctx, "task not found")
		return
	}

	if err := h.svc.CancelTask(taskID); err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	task, _ = h.svc.GetTask(taskID)
	validator.Success(ctx, CanvasTaskStatus{
		ID:           task.ID,
		CanvasID:     task.CanvasID,
		NodeID:       task.NodeID,
		ProjectID:    task.ProjectID,
		TaskType:     task.TaskType,
		Provider:     task.Provider,
		Model:        task.Model,
		Prompt:       task.Prompt,
		Status:       task.Status,
		StatusText:   statusToText(task.Status),
		ResultId:     task.ResultID,
		ResultURL:    task.ResultURL,
		ErrorMessage: task.ErrorMessage,
		Progress:     task.Progress,
		CreatedAt:    task.CreatedAt,
		UpdatedAt:    task.UpdatedAt,
	})
}

func (h *CanvasTaskHandler) GetTaskResults(ctx iris.Context) {
	taskID := ctx.Params().GetString("taskId")
	projectID := ctx.Params().GetString("projectId")

	task, err := h.svc.GetTask(taskID)
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

	result, err := h.svc.ListNodeTaskImages(ctx, nodeID, page, pageSize)
	if err != nil {
		log.Printf("GetNodeTaskImages error: nodeID=%s, err=%v", nodeID, err)
		validator.InternalServerError(ctx, err)
		return
	}

	validator.Success(ctx, result)
}

func (h *CanvasTaskHandler) GetNodeTaskImagesCount(ctx iris.Context) {
	nodeID := ctx.Params().GetString("nodeId")

	count, err := h.svc.CountNodeTaskImages(nodeID)
	if err != nil {
		log.Printf("GetNodeTaskImagesCount error: nodeID=%s, err=%v", nodeID, err)
		validator.InternalServerError(ctx, err)
		return
	}

	validator.Success(ctx, iris.Map{"count": count})
}

func statusToText(status int) string {
	switch status {
	case model.TaskStatusPending:
		return "pending"
	case model.TaskStatusProcessing:
		return "processing"
	case model.TaskStatusCompleted:
		return "completed"
	case model.TaskStatusFailed:
		return "failed"
	case model.TaskStatusCancelled:
		return "cancelled"
	default:
		return "unknown"
	}
}
