package handler

import (
	"context"
	"errors"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/ai_audio"
	canvasTaskSvc "open-film-service/internal/service/canvas_task"

	"github.com/kataras/iris/v12"
)

type AIAudioHandler struct {
	audioSvc *ai_audio.Service
	taskSvc  *canvasTaskSvc.Service
}

func NewAIAudioHandler(svc *ai_audio.Service, taskSvc *canvasTaskSvc.Service) *AIAudioHandler {
	return &AIAudioHandler{audioSvc: svc, taskSvc: taskSvc}
}

type GenerateAudioRequest struct {
	CanvasID  string `json:"canvasId,omitempty"`
	NodeID    string `json:"nodeId,omitempty"`
	Prompt    string `json:"prompt" validate:"required"`
	Model     string `json:"model" validate:"required"`
	Voice     string `json:"voice,omitempty"`
	Workspace string `json:"workspace"`
}

func (h *AIAudioHandler) InitHandler(api iris.Party) {
	api.Post("/projects/:projectId/audio/generate", h.Generate)
	api.Get("/projects/:projectId/audio/models", h.GetModels)
	api.Get("/projects/:projectId/audio/voices", h.GetVoices)
	api.Get("/projects/:projectId/audio/task", h.GetTask)
}

func (h *AIAudioHandler) Generate(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")

	req, ok := validator.ParseAndValidate[GenerateAudioRequest](ctx)
	if !ok {
		return
	}

	if req.Workspace == "" {
		req.Workspace = "24abc74312f3960a"
	}

	audioReq := ai_audio.GenerationRequest{
		Prompt:    req.Prompt,
		Model:     req.Model,
		Voice:     req.Voice,
		Workspace: req.Workspace,
	}

	aiTask, err := h.audioSvc.NewTask(context.Background(), audioReq)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	canvasTask, err := h.taskSvc.CreateTask(
		canvasTaskSvc.CreateTaskRequest{
			TaskId:    aiTask.TaskId,
			ProjectID: projectID,
			CanvasID:  req.CanvasID,
			NodeID:    req.NodeID,
			Provider:  aiTask.Provider,
			Model:     req.Model,
			Prompt:    req.Prompt,
			TaskType:  aioptions.TaskTypeAudio,
			Workspace: req.Workspace,
			Params: map[string]any{
				"voice": req.Voice,
			},
		},
	)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}
	validator.Success(ctx, canvasTask)
}

func (h *AIAudioHandler) GetTask(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")
	if projectID == "" {
		validator.InternalServerError(ctx, errors.New("projectID is required"))
		return
	}
	taskId := ctx.Params().GetString("taskId")
	if taskId == "" {
		validator.InternalServerError(ctx, errors.New("taskId is required"))
		return
	}

	task, err := h.audioSvc.GetTask(context.Background(), taskId)
	if err != nil {
		validator.InternalServerError(ctx, err)
	} else {
		validator.Success(ctx, task)
	}
}

func (h *AIAudioHandler) GetModels(ctx iris.Context) {
	models := h.audioSvc.GetModels(context.Background())
	validator.Success(ctx, models)
}

func (h *AIAudioHandler) GetVoices(ctx iris.Context) {
	voices := h.audioSvc.GetVoices()
	validator.Success(ctx, voices)
}
