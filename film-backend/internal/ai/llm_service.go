package ai

import (
	"context"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/ai/aiservice/llm"
	"open-film-service/internal/ai/aiservice/llm/openai"
	"open-film-service/internal/config"
)

type AiLLMService struct {
	manage *llm.LLMManage
}

func NewAiLLMService(cfg *config.ModelsConfig) *AiLLMService {
	manage := llm.NewLLMManage(cfg)
	service := &AiLLMService{
		manage: manage,
	}
	for _, p := range cfg.Providers {
		if p.DriverType == "openai" {
			if service, err := openai.NewLLMService(p); err == nil {
				manage.Register(service)
			} else {
				panic(err)
			}
		}
	}

	return service
}

func (s *AiLLMService) Generate(ctx context.Context, opts aioptions.ChatRequest) (*aioptions.ChatResult, error) {
	return s.manage.Generate(ctx, opts)
}

func (s *AiLLMService) GetModels() []aioptions.Model {
	return s.manage.GetModels()
}
