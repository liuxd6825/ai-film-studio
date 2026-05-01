package jimeng

import (
	"context"
	"fmt"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/infrastructure/jimeng_web"
)

var (
	ErrMissingWorkspace = fmt.Errorf("workspace is required")
	ErrMissingPrompt    = fmt.Errorf("prompt is required")
	ErrInvalidResponse  = fmt.Errorf("invalid response from server")
	ErrGenerationFailed = fmt.Errorf("video generation failed")
)

type ImageService struct {
	baseURL string
	client  *jimeng_web.JiMengClient
}

func NewImageService(baseURL string) *ImageService {
	return &ImageService{
		baseURL: baseURL,
		client:  jimeng_web.NewJimengClient(baseURL),
	}
}

func (s *ImageService) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (task *aioptions.Task, err error) {
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
