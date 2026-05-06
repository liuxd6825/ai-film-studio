package open_router

import (
	"context"
	"fmt"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/aiservice/video"
	"open-film-service/internal/config"
)

type VideoService struct {
	conf *config.ProviderConfig
}

func NewVideoService(conf *config.ProviderConfig) (video.IVideoService, error) {
	return &VideoService{
		conf: conf,
	}, nil
}

func (s *VideoService) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (*aioptions.Task, error) {
	//TODO implement me
	panic("implement me")
}

func (s *VideoService) GetTask(ctx context.Context, model string, taskID string) (*aioptions.Task, error) {
	//TODO implement me
	panic("implement me")
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
	return aioptions.Provider{
		Id:    s.conf.Id,
		Title: s.conf.Title,
	}
}
