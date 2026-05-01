package handler

import (
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/ai_model"

	"github.com/kataras/iris/v12"
)

type AIModelHandler struct {
	svc *ai_model.Service
}

func NewAIModelHandler(svc *ai_model.Service) *AIModelHandler {
	return &AIModelHandler{svc: svc}
}

func (h *AIModelHandler) ListByWorkMode(ctx iris.Context) {
	workMode := ctx.URLParamDefault("workMode", "text-to-image")
	models := h.svc.ListByWorkMode(ai_model.WorkMode(workMode))
	validator.Success(ctx, models)
}
