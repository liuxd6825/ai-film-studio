package handler

import (
	"os"

	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
)

type FileHandler struct {
	basePath string
}

func NewFileHandler(basePath string) *FileHandler {
	if basePath == "" {
		basePath = "."
	}
	return &FileHandler{basePath: basePath}
}

type ReadFileRequest struct {
	Path string `json:"path" validate:"required"`
}

type WriteFileRequest struct {
	Path    string `json:"path" validate:"required"`
	Content string `json:"content" validate:"required"`
}

type PreviewWriteRequest struct {
	Path    string `json:"path" validate:"required"`
	Content string `json:"content" validate:"required"`
}

func (h *FileHandler) ReadFile(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[ReadFileRequest](ctx)
	if !ok {
		return
	}

	fullPath := h.basePath + "/" + req.Path

	data, err := os.ReadFile(fullPath)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, iris.Map{
		"content": string(data),
	})
}

func (h *FileHandler) WriteFile(ctx iris.Context) {
	mode := ctx.GetHeader("X-Chat-Mode")
	if mode == "plan" {
		ctx.StatusCode(403)
		ctx.JSON(iris.Map{"code": 403, "message": "Cannot write files in Plan mode"})
		return
	}

	req, ok := validator.ParseAndValidate[WriteFileRequest](ctx)
	if !ok {
		return
	}

	fullPath := h.basePath + "/" + req.Path

	err := os.WriteFile(fullPath, []byte(req.Content), 0644)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.SuccessWithMessage(ctx, "file written")
}

func (h *FileHandler) PreviewWrite(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[PreviewWriteRequest](ctx)
	if !ok {
		return
	}

	existingContent := []byte{}
	fullPath := h.basePath + "/" + req.Path

	if data, err := os.ReadFile(fullPath); err == nil {
		existingContent = data
	}

	existingLines := len(existingContent)
	newLines := len(req.Content)

	validator.Success(ctx, iris.Map{
		"preview": iris.Map{
			"path":    req.Path,
			"content": req.Content,
			"changes": iris.Map{
				"linesAdded":   newLines - existingLines,
				"linesRemoved": 0,
			},
			"warning": "This operation will be executed in Build mode.",
		},
	})
}
