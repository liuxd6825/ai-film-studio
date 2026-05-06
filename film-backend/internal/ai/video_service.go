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
	for _, provider := range cfg.Providers {
		switch provider.DriverType {
		case "volces":
			manage.Register(volcengine.NewVideoService(provider.APIKey, provider.BaseURL))
		case "jimeng_web":
			manage.Register(jimeng.NewVideoService(provider.BaseURL))
		case "openai":
			manage.Register(jimeng.NewVideoService(provider.BaseURL))
		}
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
