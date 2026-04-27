package handler

import (
	"io"
	"os"
	"path/filepath"

	"github.com/kataras/iris/v12"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/file"
)

type FileAPIHandler struct {
	svc *file.Service
}

func NewFileAPIHandler(svc *file.Service) *FileAPIHandler {
	return &FileAPIHandler{svc: svc}
}

type CreateFileRequest struct {
	Name     string  `json:"name" validate:"required,maxLen=255"`
	FolderID *string `json:"folderId"`
	IsDir    bool    `json:"isDir"`
	Content  string  `json:"content"`
}

type UpdateFileRequest struct {
	Name     string  `json:"name" validate:"required,maxLen=255"`
	FolderID *string `json:"folderId"`
	Content  string  `json:"content"`
}

func (h *FileAPIHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	folderIDStr := ctx.URLParamDefault("folder_id", "")
	var folderID *string
	if folderIDStr != "" {
		folderID = &folderIDStr
	}
	allFiles := ctx.URLParamDefault("all", "false") == "true"

	files, err := h.svc.GetByProjectID(projectID, folderID, allFiles)
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, files)
}

func (h *FileAPIHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	req, ok := validator.ParseAndValidate[CreateFileRequest](ctx)
	if !ok {
		return
	}

	f, err := h.svc.Create(projectID, req.Name, req.FolderID, req.IsDir, req.Content)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, f)
}

func (h *FileAPIHandler) Get(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	f, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "file not found")
		return
	}
	validator.Success(ctx, f)
}

func (h *FileAPIHandler) Update(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	req, ok := validator.ParseAndValidate[UpdateFileRequest](ctx)
	if !ok {
		return
	}

	f, err := h.svc.Update(id, req.Name, req.FolderID, req.Content)
	if err != nil {
		validator.NotFoundError(ctx, "file not found")
		return
	}
	validator.Success(ctx, f)
}

func (h *FileAPIHandler) Delete(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if err := h.svc.Delete(id); err != nil {
		validator.NotFoundError(ctx, "file not found")
		return
	}
	validator.SuccessWithMessage(ctx, "deleted")
}

func (h *FileAPIHandler) Upload(ctx iris.Context) {
	projectID := ctx.Params().GetString("project_id")
	folderIDStr := ctx.FormValue("folderId")
	var folderID *string
	if folderIDStr != "" {
		folderID = &folderIDStr
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

	f, err := h.svc.Create(projectID, fileHeader.Filename, folderID, false, "")
	if validator.InternalServerError(ctx, err) {
		return
	}

	os.MkdirAll(filepath.Dir(f.FilePath), 0755)

	dst, err := os.Create(f.FilePath)
	if validator.InternalServerError(ctx, err) {
		return
	}
	defer dst.Close()

	io.Copy(dst, src)

	h.svc.UpdateFileSize(f.ID.String(), fileHeader.Size)

	validator.Success(ctx, f)
}

func (h *FileAPIHandler) Download(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	f, err := h.svc.GetByID(id)
	if err != nil {
		validator.NotFoundError(ctx, "file not found")
		return
	}

	ctx.SendFile(f.FilePath, f.Name)
}
