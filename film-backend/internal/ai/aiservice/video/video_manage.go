package video

import (
	"context"
	"errors"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/config"
)

type IVideoService interface {
	NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (*aioptions.Task, error)
	GetTask(ctx context.Context, model string, taskID string) (*aioptions.Task, error)
	GetModels() []aioptions.Model
	GetProvider() aioptions.Provider
}

type VideoManage struct {
	modelMap   map[string]IVideoService
	serviceMap map[string]IVideoService
	cfg        config.ModelsConfig
}

func NewVideoManage() *VideoManage {
	service := &VideoManage{
		modelMap:   make(map[string]IVideoService),
		serviceMap: make(map[string]IVideoService),
	}
	return service
}

func (s *VideoManage) Register(service IVideoService) {
	s.serviceMap[service.GetProvider().Id] = service
	models := service.GetModels()
	for _, m := range models {
		s.modelMap[m.Id] = service
	}
}

func (s *VideoManage) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (*aioptions.Task, error) {
	service, err := s.getService(opts.Model)
	if err != nil {
		return nil, err
	}
	return service.NewTask(ctx, opts)
}

func (s *VideoManage) GetTask(ctx context.Context, model, taskId string) (*aioptions.Task, error) {
	service, err := s.getService(model)
	if err != nil {
		return nil, err
	}
	return service.GetTask(ctx, model, taskId)
}

func (s *VideoManage) getService(modelId string) (IVideoService, error) {
	service, ok := s.modelMap[modelId]
	if !ok {
		return nil, errors.New("not found service id " + modelId)
	}
	return service, nil
}

func (s *VideoManage) GetModels() []aioptions.Model {
	var models []aioptions.Model
	for _, service := range s.serviceMap {
		models = append(models, service.GetModels()...)
	}
	return models
}
