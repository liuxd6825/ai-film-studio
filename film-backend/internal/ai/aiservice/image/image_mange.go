package image

import (
	"context"
	"errors"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/config"
)

type IImageService interface {
	NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (*aioptions.Task, error)
	GetTask(ctx context.Context, model, taskID string) (*aioptions.Task, error)
	GetModels() []aioptions.Model
	GetProvider() aioptions.Provider
}

type ImageManage struct {
	modelMap   map[string]IImageService
	serviceMap map[string]IImageService
	cfg        config.ModelsConfig
}

func NewImageManage() *ImageManage {
	service := &ImageManage{
		modelMap:   make(map[string]IImageService),
		serviceMap: make(map[string]IImageService),
	}
	return service
}

func (s *ImageManage) Register(service IImageService) {
	s.serviceMap[service.GetProvider().Id] = service
	for _, i := range service.GetModels() {
		s.modelMap[i.Id] = service
	}
}

func (s *ImageManage) NewTask(ctx context.Context, opts aioptions.NewTaskOptions) (task *aioptions.Task, err error) {
	service, err := s.getService(opts.Model)
	if err != nil {
		return nil, err
	}
	return service.NewTask(ctx, opts)
}

func (s *ImageManage) GetTask(ctx context.Context, modelId, taskId string) (*aioptions.Task, error) {
	service, err := s.getService(modelId)
	if err != nil {
		return nil, err
	}
	return service.GetTask(ctx, modelId, taskId)
}

func (s *ImageManage) getService(modelId string) (IImageService, error) {
	service, ok := s.modelMap[modelId]
	if ok {
		return nil, errors.New("not found service id " + modelId)
	}
	return service, nil
}

func (s *ImageManage) GetModels() []aioptions.Model {
	var models []aioptions.Model
	for _, service := range s.serviceMap {
		models = append(models, service.GetModels()...)
	}
	return models
}
