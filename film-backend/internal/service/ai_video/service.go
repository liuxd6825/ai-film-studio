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

type GenerationRequest struct {
	Model          string   `json:"model"`
	ReferenceFiles []string `json:"referenceImages,omitempty"`
	AspectRatio    string   `json:"aspectRatio,omitempty"`
	Prompt         string   `json:"prompt"`
	Duration       int      `json:"duration"`
	Fps            string   `json:"fps"`
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

func (s *Service) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (*aioptions.Task, error) {
	return s.videoService.NewTask(ctx, opts)
}

func (s *Service) GetTask(ctx context.Context, model, taskId string) (*aioptions.Task, error) {
	return s.videoService.GetTask(ctx, model, taskId)
}

func (s *Service) GetModels(ctx context.Context) []aioptions.Model {
	return s.videoService.GetModels()
}
