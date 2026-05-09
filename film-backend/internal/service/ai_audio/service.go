package ai_audio

import (
	"context"
	"open-film-service/internal/ai"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/config"
	"open-film-service/internal/repository"
)

type Voice struct {
	Id    string `json:"id,omitempty"`
	Title string `json:"title,omitempty"`
}

type GenerationRequest struct {
	Prompt    string `json:"prompt"`
	Model     string `json:"model"`
	Voice     string `json:"voice"`
	Workspace string `json:"workspace"`
}

type Service struct {
	config          *config.Config
	aiAudioService *ai.AiAudioService
	canvasTaskRepos *repository.CanvasTaskRepository
	voices         []Voice
}

func NewService(cfg *config.Config, aiAudioService *ai.AiAudioService, canvasTaskRepos *repository.CanvasTaskRepository) *Service {
	return &Service{
		config:          cfg,
		aiAudioService:  aiAudioService,
		canvasTaskRepos: canvasTaskRepos,
		voices: []Voice{
			{Id: "default", Title: "默认音色"},
			{Id: "male", Title: "男声"},
			{Id: "female", Title: "女声"},
		},
	}
}

func (s *Service) NewTask(ctx context.Context, request GenerationRequest) (*aioptions.Task, error) {
	newTaskOptions := aioptions.NewTaskOptions{
		Model:    request.Model,
		Prompt:   request.Prompt,
		TaskType: aioptions.TaskTypeAudio,
		Workspace: request.Workspace,
	}
	return s.aiAudioService.NewTask(ctx, newTaskOptions)
}

func (s *Service) GetTask(ctx context.Context, taskID string) (*aioptions.Task, error) {
	task, err := s.canvasTaskRepos.GetByID(taskID)
	if err != nil {
		return nil, err
	}
	return s.aiAudioService.GetTask(ctx, task.Model, taskID)
}

func (s *Service) GetModels(ctx context.Context) []aioptions.Model {
	return s.aiAudioService.GetModels()
}

func (s *Service) GetVoices() []Voice {
	return s.voices
}