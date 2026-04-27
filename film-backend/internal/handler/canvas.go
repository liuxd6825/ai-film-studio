package handler

import (
	"errors"
	"strconv"
	"time"

	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/canvas"

	"github.com/kataras/iris/v12"
)

type CanvasHandler struct {
	svc *canvas.Service
}

func NewCanvasHandler(svc *canvas.Service) *CanvasHandler {
	return &CanvasHandler{svc: svc}
}

type SaveCanvasRequest struct {
	Name     string `json:"name"`
	Nodes    string `json:"nodes"`
	Edges    string `json:"edges"`
	Viewport string `json:"viewport"`
	History  string `json:"history"`
}

type CreateCanvasRequest struct {
	Name string `json:"name"`
}

type UpdateCanvasRequest struct {
	Name string `json:"name"`
}

type ListCanvasesResponse struct {
	Canvases []*CanvasItem `json:"canvases"`
	Total    int64         `json:"total"`
	Page     int           `json:"page"`
	PageSize int           `json:"pageSize"`
}

type CanvasItem struct {
	ID        string    `json:"id"`
	ProjectID string    `json:"projectId"`
	Name      string    `json:"name"`
	CreatorID string    `json:"creatorId"`
	Nodes     string    `json:"nodes"`
	Edges     string    `json:"edges"`
	Viewport  string    `json:"viewport"`
	History   string    `json:"history"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (h *CanvasHandler) List(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")

	name := ctx.URLParam("name")
	startDateStr := ctx.URLParam("startDate")
	endDateStr := ctx.URLParam("endDate")
	pageStr := ctx.URLParamDefault("page", "1")
	pageSizeStr := ctx.URLParamDefault("pageSize", "20")

	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)

	var startDate, endDate int64
	if startDateStr != "" {
		startDate, _ = strconv.ParseInt(startDateStr, 10, 64)
	}
	if endDateStr != "" {
		endDate, _ = strconv.ParseInt(endDateStr, 10, 64)
	}

	filter := &canvas.ListFilter{
		Name:      name,
		StartDate: startDate,
		EndDate:   endDate,
		Page:      page,
		PageSize:  pageSize,
	}

	canvases, total, err := h.svc.List(projectID, filter)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "internal error"})
		return
	}

	items := make([]*CanvasItem, len(canvases))
	for i, c := range canvases {
		items[i] = &CanvasItem{
			ID:        c.ID,
			ProjectID: c.ProjectID,
			Name:      c.Name,
			CreatorID: c.CreatorID,
			Nodes:     c.Nodes,
			Edges:     c.Edges,
			Viewport:  c.Viewport,
			History:   c.History,
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
		}
	}

	ctx.JSON(iris.Map{
		"code": 0,
		"data": ListCanvasesResponse{
			Canvases: items,
			Total:    total,
			Page:     page,
			PageSize: pageSize,
		},
	})
}

func (h *CanvasHandler) Create(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")

	var req CreateCanvasRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	if req.Name == "" {
		validator.BadRequestWithField(ctx, "name", "name is required")
		return
	}

	creatorID := ctx.URLParamDefault("creator_id", "")

	c, err := h.svc.Create(projectID, req.Name, creatorID)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "internal error"})
		return
	}

	ctx.JSON(iris.Map{
		"code": 0,
		"data": iris.Map{
			"id":        c.ID,
			"projectId": c.ProjectID,
			"name":      c.Name,
			"creatorId": c.CreatorID,
			"nodes":     c.Nodes,
			"edges":     c.Edges,
			"viewport":  c.Viewport,
			"history":   c.History,
			"createdAt": c.CreatedAt,
			"updatedAt": c.UpdatedAt,
		},
	})
}

func (h *CanvasHandler) Get(ctx iris.Context) {
	canvasID := ctx.Params().GetString("canvasId")

	c, err := h.svc.GetByID(canvasID)
	if err != nil {
		if errors.Is(err, canvas.ErrCanvasNotFound) {
			validator.NotFoundError(ctx, "canvas not found")
			return
		}
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "internal error"})
		return
	}

	ctx.JSON(iris.Map{
		"code": 0,
		"data": iris.Map{
			"id":        c.ID,
			"projectId": c.ProjectID,
			"name":      c.Name,
			"creatorId": c.CreatorID,
			"nodes":     c.Nodes,
			"edges":     c.Edges,
			"viewport":  c.Viewport,
			"history":   c.History,
			"createdAt": c.CreatedAt,
			"updatedAt": c.UpdatedAt,
		},
	})
}

func (h *CanvasHandler) Update(ctx iris.Context) {
	canvasID := ctx.Params().GetString("canvasId")

	var req UpdateCanvasRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	if req.Name == "" {
		validator.BadRequestWithField(ctx, "name", "name is required")
		return
	}

	err := h.svc.Update(canvasID, req.Name)
	if err != nil {
		if errors.Is(err, canvas.ErrCanvasNotFound) {
			validator.NotFoundError(ctx, "canvas not found")
			return
		}
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "internal error"})
		return
	}

	ctx.JSON(iris.Map{"code": 0, "message": "updated"})
}

func (h *CanvasHandler) Save(ctx iris.Context) {
	canvasID := ctx.Params().GetString("canvasId")

	var req SaveCanvasRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	err := h.svc.Save(canvasID, &canvas.CanvasData{
		Nodes:    req.Nodes,
		Edges:    req.Edges,
		Viewport: req.Viewport,
		History:  req.History,
	})
	if err != nil {
		if errors.Is(err, canvas.ErrCanvasNotFound) {
			validator.NotFoundError(ctx, "canvas not found")
			return
		}
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "internal error", "error": err.Error()})
		return
	}

	ctx.JSON(iris.Map{"code": 0, "message": "saved"})
}

func (h *CanvasHandler) Delete(ctx iris.Context) {
	canvasID := ctx.Params().GetString("canvasId")

	err := h.svc.Delete(canvasID)
	if err != nil {
		if errors.Is(err, canvas.ErrCanvasNotFound) {
			validator.NotFoundError(ctx, "canvas not found")
			return
		}
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "internal error"})
		return
	}

	ctx.JSON(iris.Map{"code": 0, "message": "deleted"})
}

func (h *CanvasHandler) GetByProject(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")

	name := ctx.URLParam("name")
	startDateStr := ctx.URLParam("startDate")
	endDateStr := ctx.URLParam("endDate")

	var startDate, endDate int64
	if startDateStr != "" {
		startDate, _ = strconv.ParseInt(startDateStr, 10, 64)
	}
	if endDateStr != "" {
		endDate, _ = strconv.ParseInt(endDateStr, 10, 64)
	}

	canvases, _, err := h.svc.List(projectID, &canvas.ListFilter{
		Name:      name,
		StartDate: startDate,
		EndDate:   endDate,
		Page:      1,
		PageSize:  100,
	})
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "internal error"})
		return
	}

	if len(canvases) == 0 {
		c, _ := h.svc.Create(projectID, "Default Canvas", "")
		ctx.JSON(iris.Map{
			"code": 0,
			"data": iris.Map{
				"id":        c.ID,
				"projectId": c.ProjectID,
				"name":      c.Name,
				"creatorId": c.CreatorID,
				"nodes":     c.Nodes,
				"edges":     c.Edges,
				"viewport":  c.Viewport,
				"history":   c.History,
				"createdAt": c.CreatedAt,
				"updatedAt": c.UpdatedAt,
			},
		})
		return
	}

	c := canvases[0]
	ctx.JSON(iris.Map{
		"code": 0,
		"data": iris.Map{
			"id":        c.ID,
			"projectId": c.ProjectID,
			"name":      c.Name,
			"creatorId": c.CreatorID,
			"nodes":     c.Nodes,
			"edges":     c.Edges,
			"viewport":  c.Viewport,
			"history":   c.History,
			"createdAt": c.CreatedAt,
			"updatedAt": c.UpdatedAt,
		},
	})
}

func (h *CanvasHandler) SaveByProject(ctx iris.Context) {
	projectID := ctx.Params().GetString("projectId")

	var req SaveCanvasRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	canvases, _, err := h.svc.List(projectID, &canvas.ListFilter{Page: 1, PageSize: 1})
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "internal error"})
		return
	}

	var canvasID string
	if len(canvases) == 0 {
		c, err := h.svc.Create(projectID, "Default Canvas", "")
		if err != nil {
			ctx.StatusCode(500)
			ctx.JSON(iris.Map{"code": 500, "message": "internal error"})
			return
		}
		canvasID = c.ID
	} else {
		canvasID = canvases[0].ID
	}

	err = h.svc.Save(canvasID, &canvas.CanvasData{
		Nodes:    req.Nodes,
		Edges:    req.Edges,
		Viewport: req.Viewport,
		History:  req.History,
	})
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "internal error"})
		return
	}

	ctx.JSON(iris.Map{"code": 0, "message": "saved"})
}

func formatTime(t time.Time) string {
	return t.Format("2006-01-02 15:04:05")
}
