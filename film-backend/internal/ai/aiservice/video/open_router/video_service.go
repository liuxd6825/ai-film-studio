package open_router

import (
	"context"
	"fmt"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/aiservice/video"
	"open-film-service/internal/ai/infrastructure/open_router_api"
	"open-film-service/internal/config"
)

type VideoService struct {
	conf   *config.ProviderConfig
	client *open_router_api.Client
}

func NewVideoService(conf *config.ProviderConfig) video.IVideoService {
	client := open_router_api.NewClient(conf.BaseURL, conf.APIKey)
	return &VideoService{
		conf:   conf,
		client: client,
	}
}

func (s *VideoService) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (*aioptions.Task, error) {
	return s.client.NewTask(ctx, opts)
}

func (s *VideoService) GetTask(ctx context.Context, model, taskID string) (*aioptions.Task, error) {
	return s.client.GetTask(ctx, model, taskID)
}

func (s *VideoService) GetModels() []aioptions.Model {
	var list []aioptions.Model
	for _, item := range s.conf.Models {
		list = append(list, aioptions.Model{
			Id:    fmt.Sprintf("%s/%s", s.conf.Id, item.Id),
			Title: fmt.Sprintf("%s/%s", s.conf.Title, item.Title),
		})
	}
	return list
}

func (s *VideoService) GetProvider() aioptions.Provider {
	return s.client.GetProvider()
}
