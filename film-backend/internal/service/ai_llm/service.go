package ai_llm

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
	ErrGenerationFailed = errors.New("image generation failed")
)

type ImageSize string

const (
	Size1K ImageSize = "1K"
	Size2K ImageSize = "2K"
	Size4K ImageSize = "4K"
	Size8K ImageSize = "8K"
)

func (s ImageSize) String() string {
	return string(s)
}

type GenerationRequest struct {
	Prompt          string    `json:"prompt"`
	Model           string    `json:"model"`
	Size            ImageSize `json:"size"`
	Quality         string    `json:"quality,omitempty"`
	N               int       `json:"n,omitempty"`
	Provider        string    `json:"provider"`
	APIKey          string    `json:"-"`
	BaseURL         string    `json:"-"`
	ReferenceImages []string  `json:"referenceImages,omitempty"`
	AspectRatio     string    `json:"aspectRatio,omitempty"`
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
	aiLLMService *ai.AiLLMService
}

func NewService(config *config.Config, aiLLMService *ai.AiLLMService) *Service {
	return &Service{
		config:       config,
		aiLLMService: aiLLMService,
	}
}

func (s *Service) Generate(ctx context.Context, opts aioptions.ChatRequest) (*aioptions.ChatResult, error) {
	return s.aiLLMService.Generate(ctx, opts)
}

func (s *Service) GetModels(ctx context.Context) []aioptions.Model {
	return s.aiLLMService.GetModels()
}
