package ai

import (
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
		for _, m := range p.Models {
			if m.DriverType == "openai" {
				if service, err := openai.NewLLMService(m); err == nil {
					manage.Register(service)
				} else {
					panic(err)
				}
			}
		}
	}

	return service
}

func (s *AiLLMService) GetModels() []aioptions.Model {
	return s.manage.GetModels()
}
