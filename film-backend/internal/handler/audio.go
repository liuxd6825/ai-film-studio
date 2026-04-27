package handler

import (
	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/audio"
)

type AudioHandler struct {
	svc *audio.Service
}

func NewAudioHandler(svc *audio.Service) *AudioHandler {
	return &AudioHandler{svc: svc}
}

type SynthesizeRequest struct {
	Text  string `json:"text" validate:"required"`
	Voice string `json:"voice"`
}

func (h *AudioHandler) Synthesize(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[SynthesizeRequest](ctx)
	if !ok {
		return
	}

	url, err := h.svc.Synthesize(ctx.Request().Context(), req.Text, req.Voice)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.JSON(iris.Map{"url": url})
}
