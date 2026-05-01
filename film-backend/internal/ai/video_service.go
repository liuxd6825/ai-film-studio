package ai

import (
	"context"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/aiservice/video"
	"open-film-service/internal/ai/aiservice/video/jimeng"
	"open-film-service/internal/ai/aiservice/video/volcengine"
	"open-film-service/internal/config"
)

type AiVideoService struct {
	manage *video.VideoManage
}

func NewAiVideoService(cfg *config.ModelsConfig) *AiVideoService {
	manage := video.NewVideoManage()
	if provider, ok := cfg.GetProvider("jimeng"); ok {
		manage.Register(jimeng.NewVideoService(provider.BaseURL))
	}

	if provider, ok := cfg.GetProvider("volces"); ok {
		service := volcengine.NewVideoService(provider.APIKey, provider.BaseURL)
		manage.Register(service)
	}

	service := &AiVideoService{
		manage: manage,
	}
	return service
}

func (s *AiVideoService) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (*aioptions.Task, error) {
	return s.manage.NewTask(ctx, opts)
}

func (s *AiVideoService) GetTask(ctx context.Context, modelId, taskId string) (*aioptions.Task, error) {
	return s.manage.GetTask(ctx, modelId, taskId)
}

func (s *AiVideoService) GetModels() []aioptions.Model {
	return s.manage.GetModels()
}
