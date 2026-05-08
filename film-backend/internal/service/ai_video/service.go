package ai_video

import (
	"context"
	"errors"
	"open-film-service/internal/ai"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/config"
)

var (
	ErrMissingAPIKey    = errors.New("API key is required")
	ErrInvalidProvider  = errors.New("invalid provider")
	ErrInvalidModel     = errors.New("invalid model")
	ErrGenerationFailed = errors.New("video generation failed")
	ErrJobNotFound      = errors.New("job not found")
)

type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusProcessing JobStatus = "processing"
	JobStatusCompleted  JobStatus = "completed"
	JobStatusFailed     JobStatus = "failed"
)

type AIGenerateVideoRequest struct {
	CanvasID       string   `json:"canvas_id,omitempty"  validate:"required"`
	NodeID         string   `json:"node_id,omitempty"  validate:"required"`
	Prompt         string   `json:"prompt" validate:"required"`
	Model          string   `json:"model"  validate:"required"`
	AspectRatio    string   `json:"aspect_ratio,omitempty"  validate:"required"`
	Duration       int      `json:"duration,omitempty"  validate:"required"`
	ReferenceFiles []string `json:"reference_files,omitempty"`
	Workspace      string   `json:"workspace"`
	PromptType     string   `json:"prompt_type"`
}

type AIGenerateVideoResponse struct {
	TaskID    string `json:"task_id,omitempty"`
	ResultID  string `json:"result_id"`
	ResultURL string `json:"result_url"`
	Status    int    `json:"status"`
}

type GenerationRequest struct {
	Model          string   `json:"model"`
	ReferenceFiles []string `json:"referenceImages,omitempty"`
	AspectRatio    string   `json:"aspectRatio,omitempty"`
	Prompt         string   `json:"prompt"`
	Duration       int      `json:"duration"`
	Fps            string   `json:"fps"`
	Workspace      string   `json:"workspace"`
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
	config       *config.Config
	videoService *ai.AiVideoService
}

func NewService(config *config.Config, videoService *ai.AiVideoService) *Service {
	return &Service{
		config:       config,
		videoService: videoService,
	}
}

func (s *Service) NewTask(ctx context.Context, request AIGenerateVideoRequest) (*aioptions.Task, error) {
	var refItems []aioptions.NewTaskRefItem
	for _, imageUrl := range request.ReferenceFiles {
		refItems = append(refItems, aioptions.NewTaskRefItem{
			Type: aioptions.TaskTypeImage,
			Url:  imageUrl,
		})
	}
	prompt := request.Prompt
	newTaskOptions := aioptions.NewTaskOptions{
		Model:     request.Model,
		Prompt:    prompt,
		RefItems:  refItems,
		Workspace: request.Workspace,
		TaskType:  aioptions.TaskTypeVideo,
		Video: aioptions.VideoOptions{
			GenerateAudio: true,
			AspectRatio:   request.AspectRatio,
			Duration:      request.Duration,
			Resolution:    aioptions.Resolution2K,
		},
	}
	return s.videoService.NewTask(ctx, newTaskOptions)
}

func (s *Service) GetTask(ctx context.Context, model, taskId string) (*aioptions.Task, error) {
	return s.videoService.GetTask(ctx, model, taskId)
}

func (s *Service) GetModels(ctx context.Context) []aioptions.Model {
	return s.videoService.GetModels()
}
