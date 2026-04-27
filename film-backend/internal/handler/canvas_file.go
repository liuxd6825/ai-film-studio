package handler

import (
	"fmt"

	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/canvas_file"

	"github.com/kataras/iris/v12"
)

type CanvasFileHandler struct {
	svc *canvas_file.Service
}

func NewCanvasFileHandler(svc *canvas_file.Service) *CanvasFileHandler {
	return &CanvasFileHandler{svc: svc}
}

type UploadCanvasFileResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	DownloadURL string `json:"downloadUrl"`
	FileSize    int64  `json:"fileSize"`
	ContentType string `json:"contentType"`
}

func (h *CanvasFileHandler) Upload(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")
	canvasID := ctx.URLParamDefault("canvas_id", "")
	nodeID := ctx.FormValue("node_id")

	if nodeID == "" {
		validator.BadRequestWithField(ctx, "node_id", "node_id is required")
		return
	}

	_, fileHeader, err := ctx.FormFile("file")
	if err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "no file uploaded"})
		return
	}

	src, err := fileHeader.Open()
	if validator.InternalServerError(ctx, err) {
		return
	}
	defer src.Close()

	file, err := h.svc.Create(
		projectID,
		canvasID,
		nodeID,
		fileHeader.Filename,
		"", // ext - will be extracted from filename in service
		fileHeader.Size,
		fileHeader.Header.Get("Content-Type"),
		src,
	)
	if validator.InternalServerError(ctx, err) {
		return
	}

	downloadURL := fmt.Sprintf("/api/v1/projects/%s/canvas/%s/files/%s/download", projectID, canvasID, file.ID)

	validator.Success(ctx, UploadCanvasFileResponse{
		ID:          file.ID,
		Name:        file.Name,
		DownloadURL: downloadURL,
		FileSize:    file.FileSize,
		ContentType: file.ContentType,
	})
}

func (h *CanvasFileHandler) Download(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")
	canvasID := ctx.Params().GetString("canvasId")
	fileID := ctx.Params().GetString("fileId")

	file, err := h.svc.GetByID(fileID)
	if err != nil {
		validator.NotFoundError(ctx, "file not found")
		return
	}

	if file.ProjectID != projectID || file.CanvasID != canvasID {
		validator.NotFoundError(ctx, "file not found")
		return
	}

	ctx.SendFile(file.FilePath, file.Name)
}

func (h *CanvasFileHandler) GetNodeFileCount(ctx iris.Context) {
	nodeID := ctx.URLParamDefault("node_id", "")
	if nodeID == "" {
		validator.BadRequestWithField(ctx, "node_id", "node_id is required")
		return
	}
	if nodeID == "21c1cd40-b398-4f4a-9d23-6cc829852333" {
		println(nodeID)
	}

	count, err := h.svc.CountByNodeID(nodeID)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	validator.Success(ctx, iris.Map{"count": count})
}
