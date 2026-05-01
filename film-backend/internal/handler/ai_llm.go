package handler

import (
	"context"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/ai_llm"

	"github.com/kataras/iris/v12"
)

type AILLMHandler struct {
	svc *ai_llm.Service
}

func NewAILLMHandler(svc *ai_llm.Service) *AILLMHandler {
	return &AILLMHandler{svc: svc}
}

func (h *AILLMHandler) GetModels(ctx iris.Context) {
	models := h.svc.GetModels(context.Background())
	validator.Success(ctx, models)
}
