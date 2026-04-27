package ai_video

import (
	"context"
	"errors"
	"open-film-service/internal/config"
	"open-film-service/internal/service/ai_jimeng"
	"strconv"
	"time"
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
	config        *config.Config
	jimengService *ai_jimeng.Service
}

func NewService(config *config.Config, jimengService *ai_jimeng.Service) *Service {
	return &Service{
		config:        config,
		jimengService: jimengService,
	}
}

func (s *Service) Generate(ctx context.Context, req GenerationRequest) (*GenerationResult, error) {
	startTime := time.Now()

	switch req.Model {
	case "seedance_2.0_fast_web":
		return s.generateWithJiMengWeb(ctx, req, startTime)
	case "seedance_2.0_web":
		return s.generateWithJiMengWeb(ctx, req, startTime)
	case "seedance_2.0_fast_web_vip":
		return s.generateWithJiMengWeb(ctx, req, startTime)
	case "seedance_2.0_web_vip":
		return s.generateWithJiMengWeb(ctx, req, startTime)
	default:
		return nil, ErrInvalidProvider
	}
}

func (s *Service) generateWithJiMengWeb(ctx context.Context, req GenerationRequest, startTime time.Time) (*GenerationResult, error) {
	service := s.jimengService
	genReq := ai_jimeng.GenerateRequest{
		Prompt:      req.Prompt,
		Model:       req.Model,
		AspectRatio: req.AspectRatio,
		WorkType:    ai_jimeng.WorkType_ALL.String(),
		FilesUrl:    req.ReferenceFiles,
		Workspace:   "11117754646028",
		Seed:        strconv.FormatInt(int64(req.Duration), 10) + "s",
	}
	response, err := service.Generate(ctx, genReq)
	if err != nil {
		return nil, err
	}
	return &GenerationResult{
		ID:        response.ResultID,
		ResultId:  response.ResultID,
		ResultUrl: response.ResultUrl,
		Provider:  "jimeng",
	}, nil
}
