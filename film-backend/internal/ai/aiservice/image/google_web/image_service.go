package google_web

import (
	"context"
	"fmt"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/infrastructure/google_web"
)

var (
	ErrMissingWorkspace = fmt.Errorf("workspace is required")
	ErrMissingPrompt    = fmt.Errorf("prompt is required")
	ErrInvalidResponse  = fmt.Errorf("invalid response from server")
	ErrGenerationFailed = fmt.Errorf("video generation failed")
)

type ImageService struct {
	baseURL string
	client  *google_web.GoogleWebClient
}

func NewImageService(baseURL string) *ImageService {
	return &ImageService{
		baseURL: baseURL,
		client:  google_web.NewGoogleWebClient(baseURL),
	}
}

func (s *ImageService) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (task *aioptions.Task, err error) {
	opts.TaskType = aioptions.TaskTypeImage
	opts.Model, err = s.client.GetImageModel(opts.Model)
	if err != nil {
		return nil, err
	}
	return s.client.NewTask(ctx, opts)
}

func (s *ImageService) GetTask(ctx context.Context, model, taskID string) (*aioptions.Task, error) {
	return s.client.GetTask(ctx, model, taskID)
}

func (s *ImageService) GetModels() []aioptions.Model {
	return s.client.GetImageModels()
}

func (s *ImageService) GetProvider() aioptions.Provider {
	return s.client.GetProvider()
}
