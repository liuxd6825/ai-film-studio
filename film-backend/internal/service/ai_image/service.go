package ai_image

import (
	"context"
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

type GenerationRequest struct {
	Prompt          string   `json:"prompt"`
	Model           string   `json:"model"`
	ReferenceImages []string `json:"referenceImages,omitempty"`
	AspectRatio     string   `json:"aspectRatio,omitempty"`
	Workspace       string   `json:"workspace"`
	Resolution      string   `json:"resolution"`
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
}

func NewService(config *config.Config, aiImageService *ai.AiImageService, canvasTaskRepos *repository.CanvasTaskRepository) *Service {
	return &Service{
		config:          config,
		aiImageService:  aiImageService,
		canvasTaskRepos: canvasTaskRepos,
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
	newTaskOptions := aioptions.NewTaskOptions{
		Model:     request.Model,
		Prompt:    request.Prompt,
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
