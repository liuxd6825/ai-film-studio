package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/memory"
)

type MemoryHandler struct {
	svc *memory.Service
}

func NewMemoryHandler(svc *memory.Service) *MemoryHandler {
	return &MemoryHandler{svc: svc}
}

func (h *MemoryHandler) GetMemory(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	sessionID := ctx.Params().GetString("session_id")

	mem, err := h.svc.GetBySession(projectID, sessionID)
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, mem)
}

func (h *MemoryHandler) DeleteMemory(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if validator.InternalServerError(ctx, h.svc.Delete(id)) {
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}
