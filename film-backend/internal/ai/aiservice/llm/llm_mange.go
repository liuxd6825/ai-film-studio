package llm

import (
	"context"
	"errors"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/config"
)

type ILLMService interface {
	Generate(ctx context.Context, opts aioptions.ChatRequest) (*aioptions.ChatResult, error)
	GetModels() []aioptions.Model
	GetProvider() aioptions.Provider
}

type LLMManage struct {
	modelMap   map[string]ILLMService
	serviceMap map[string]ILLMService
	cfg        *config.ModelsConfig
}

func NewLLMManage(cfg *config.ModelsConfig) *LLMManage {
	return &LLMManage{
		modelMap:   make(map[string]ILLMService),
		serviceMap: make(map[string]ILLMService),
		cfg:        cfg,
	}
}

func (s *LLMManage) Register(service ILLMService) {
	s.serviceMap[service.GetProvider().Id] = service
	models := service.GetModels()
	for _, m := range models {
		s.modelMap[m.Id] = service
	}
}

func (s *LLMManage) Generate(ctx context.Context, opts aioptions.ChatRequest) (*aioptions.ChatResult, error) {
	service, err := s.getService(opts.Model)
	if err != nil {
		return nil, err
	}
	return service.Generate(ctx, opts)
}

func (s *LLMManage) getService(modelId string) (ILLMService, error) {
	service, ok := s.modelMap[modelId]
	if !ok {
		return nil, errors.New("not found service id " + modelId)
	}
	return service, nil
}

func (s *LLMManage) GetModels() []aioptions.Model {
	var models []aioptions.Model
	for _, service := range s.serviceMap {
		models = append(models, service.GetModels()...)
	}
	return models
}
