package jimeng

import (
	"context"
	"fmt"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/aiservice/video"
	"open-film-service/internal/ai/infrastructure/jimeng_web"
)

var (
	ErrMissingWorkspace = fmt.Errorf("workspace is required")
	ErrMissingPrompt    = fmt.Errorf("prompt is required")
	ErrInvalidResponse  = fmt.Errorf("invalid response from server")
	ErrGenerationFailed = fmt.Errorf("video generation failed")
)

const (
	ProviderId    = "jimeng"
	ProviderTitle = "即梦"
)

type VideoService struct {
	baseURL string
	client  *jimeng_web.JiMengClient
}

func NewVideoService(baseURL string) *VideoService {
	return &VideoService{
		baseURL: baseURL,
		client:  jimeng_web.NewJimengClient(baseURL),
	}
}

func newVideoService(baseURL string) video.IVideoService {
	return NewVideoService(baseURL)
}

func (s *VideoService) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (task *aioptions.Task, err error) {
	return s.client.NewTask(ctx, opts)
}

func (s *VideoService) GetTask(ctx context.Context, model, taskID string) (*aioptions.Task, error) {
	return s.client.GetTask(ctx, model, taskID)
}

func (s *VideoService) GetModels() []aioptions.Model {
	return s.client.GetVideoModels()
}

func (s *VideoService) GetProvider() aioptions.Provider {
	return s.client.GetProvider()
}
