package ai

import (
	"context"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/aiservice/image"
	"open-film-service/internal/ai/aiservice/image/google_web"
	"open-film-service/internal/ai/aiservice/image/jimeng"
	"open-film-service/internal/config"
)

type AiImageService struct {
	manage *image.ImageManage
}

func NewAiImageService(cfg *config.ModelsConfig) *AiImageService {
	manage := image.NewImageManage()
	for _, provider := range cfg.Providers {
		switch provider.DriverType {
		case "google_web":
			manage.Register(google_web.NewImageService(provider.BaseURL))
		case "jimeng_web":
			manage.Register(jimeng.NewImageService(provider.BaseURL))
		}
	}
	service := &AiImageService{
		manage: manage,
	}
	return service
}

func (s *AiImageService) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (*aioptions.Task, error) {
	return s.manage.NewTask(ctx, opts)
}

func (s *AiImageService) GetTask(ctx context.Context, modelId, taskId string) (*aioptions.Task, error) {
	return s.manage.GetTask(ctx, modelId, taskId)
}

func (s *AiImageService) GetModels() []aioptions.Model {
	return s.manage.GetModels()
}
