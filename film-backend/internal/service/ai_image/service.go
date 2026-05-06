package ai_image

import (
	"context"
	_ "embed"
	"errors"
	"open-film-service/internal/ai"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/config"
	"open-film-service/internal/repository"
)

var (
	ErrMissingAPIKey    = errors.New("API key is required")
	ErrInvalidProvider  = errors.New("invalid provider")
	ErrInvalidModel     = errors.New("invalid model")
	ErrGenerationFailed = errors.New("image generation failed")
)

//go:embed prompts/六宫格.md
var _six_grid_layout string

// PromptType 提示词类型
type PromptType struct {
	Id    string `json:"id,omitempty"`
	Title string `json:"title,omitempty"   `
}

type GenerationRequest struct {
	Prompt          string   `json:"prompt"`
	Model           string   `json:"model"`
	ReferenceImages []string `json:"referenceImages,omitempty"`
	AspectRatio     string   `json:"aspectRatio,omitempty"`
	Workspace       string   `json:"workspace"`
	Resolution      string   `json:"resolution"`
	PromptType      string   `json:"promptType"`
}

type GenerationResult struct {
	ID               string `json:"id"`
	ImageURL         string `json:"imageUrl"`
	ImageData        string `json:"imageData,omitempty"`
	AspectRatio      string `json:"aspectRatio"`
	ProcessingTimeMs int64  `json:"processingTimeMs"`
	Model            string `json:"model"`
	Provider         string `json:"provider"`
	ResultId         string `json:"resultId"`
	ResultUrl        string `json:"resultUrl"`
}

type Service struct {
	config          *config.Config
	aiImageService  *ai.AiImageService
	canvasTaskRepos *repository.CanvasTaskRepository
	promptTypes     []PromptType
}

func NewService(config *config.Config, aiImageService *ai.AiImageService, canvasTaskRepos *repository.CanvasTaskRepository) *Service {
	return &Service{
		config:          config,
		aiImageService:  aiImageService,
		canvasTaskRepos: canvasTaskRepos,
		promptTypes: []PromptType{
			{
				Id:    "image",
				Title: "图片",
			},
			{
				Id:    "six_grid_layout",
				Title: "六宫格",
			},
		},
	}
}

func (s *Service) NewTask(ctx context.Context, request GenerationRequest) (task *aioptions.Task, err error) {
	var refItems []aioptions.NewTaskRefItem
	for _, imageUrl := range request.ReferenceImages {
		refItems = append(refItems, aioptions.NewTaskRefItem{
			Type: aioptions.TaskTypeImage,
			Url:  imageUrl,
		})
	}
	prompt := request.Prompt
	if request.PromptType == "six_grid_layout" {
		prompt = "根据以下要求生图片:\n```\n" + prompt + "\n```\n" + _six_grid_layout
	}

	newTaskOptions := aioptions.NewTaskOptions{
		Model:     request.Model,
		Prompt:    prompt,
		RefItems:  refItems,
		Workspace: request.Workspace,
		TaskType:  aioptions.TaskTypeImage,
		Image: aioptions.ImageOptions{
			AspectRatio: request.AspectRatio,
			Resolution:  aioptions.Resolution(request.Resolution),
		},
	}
	return s.aiImageService.NewTask(ctx, newTaskOptions)
}

func (s *Service) GetTask(ctx context.Context, taskID string) (*aioptions.Task, error) {
	task, err := s.canvasTaskRepos.GetByID(taskID)
	if err != nil {
		return nil, err
	}
	return s.aiImageService.GetTask(ctx, task.Model, taskID)
}

func (s *Service) GetModels(ctx context.Context) []aioptions.Model {
	return s.aiImageService.GetModels()
}

func (s *Service) GetPromptTypes() []PromptType {
	return s.promptTypes
}
