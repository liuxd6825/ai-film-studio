package handler

import (
	"context"
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/ai_llm"
	"strings"

	"github.com/kataras/iris/v12"
)

type AILLMHandler struct {
	llmSvc      *ai_llm.Service
	promptTypes []ai_llm.PromptType
}

type ChatRequest struct {
	CanvasID        string   `json:"canvasId,omitempty"   validate:"required"`
	NodeID          string   `json:"nodeId,omitempty"  validate:"required"`
	Prompt          string   `json:"prompt" validate:"required"`
	Model           string   `json:"model"  validate:"required"`
	PromptType      string   `json:"promptType"  validate:"required"`
	ReferenceImages []string `json:"referenceImages,omitempty"`
}

func NewAILLMHandler(llmSvc *ai_llm.Service) *AILLMHandler {
	return &AILLMHandler{
		llmSvc: llmSvc,
	}
}
func (h *AILLMHandler) InitHandler(api iris.Party) {
	api.Get("/projects/:projectId/llm/models", h.GetModels)
	api.Post("/projects/:projectId/llm/generate", h.Generate)
	api.Get("/projects/:projectId/llm/prompt-types", h.GetPromptTypes)
}

func (h *AILLMHandler) Generate(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[ChatRequest](ctx)
	if !ok {
		return
	}

	if len(req.ReferenceImages) > 0 {
		for i, fileUrl := range req.ReferenceImages {
			if !strings.HasPrefix(fileUrl, "http://") && !strings.HasPrefix(fileUrl, "https://") {
				req.ReferenceImages[i] = "http://127.0.0.1:17781" + fileUrl
			}
		}
	}

	chatRequest := aioptions.ChatRequest{
		Prompt:     req.Prompt,
		Model:      req.Model,
		PromptType: req.PromptType,
	}

	result, err := h.llmSvc.Generate(ctx, chatRequest)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}
	validator.Success(ctx, result)

}

func (h *AILLMHandler) GetModels(ctx iris.Context) {
	models := h.llmSvc.GetModels(context.Background())
	validator.Success(ctx, models)
}

func (h *AILLMHandler) GetPromptTypes(ctx iris.Context) {
	validator.Success(ctx, h.llmSvc.GetPromptTypes())
}
