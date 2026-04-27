package handler

import (
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/story_page"
	"open-film-service/internal/service/storyboard"

	"github.com/kataras/iris/v12"
)

type BoardHandler struct {
	boardSvc     *storyboard.BoardService
	storyPageSvc *story_page.Service
}

func NewBoardHandler(boardSvc *storyboard.BoardService, storyPageSvc *story_page.Service) *BoardHandler {
	return &BoardHandler{
		boardSvc:     boardSvc,
		storyPageSvc: storyPageSvc,
	}
}

type CreateBoardReq struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *BoardHandler) ListBoards(ctx iris.Context) {
	projectID := ctx.Params().Get("project_id")
	boards, err := h.boardSvc.ListBoards(ctx.Request().Context(), projectID)
	if err != nil {
		ctx.StopWithJSON(500, iris.Map{"code": 500, "message": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"code": 0, "data": boards})
}

func (h *BoardHandler) CreateBoard(ctx iris.Context) {
	projectID := ctx.Params().Get("project_id")
	var req CreateBoardReq
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StopWithJSON(400, iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	board, err := h.boardSvc.CreateBoard(ctx.Request().Context(), projectID, req.Name, req.Description)
	if err != nil {
		ctx.StopWithJSON(500, iris.Map{"code": 500, "message": err.Error()})
		return
	}
	ctx.JSON(iris.Map{"code": 0, "data": board})
}

type CreateStoryPageForBoardReq struct {
	Title     string `json:"title" validate:"required,maxLen=255"`
	Desc      string `json:"desc"`
	SortOrder int    `json:"sortOrder"`
	StoryTime string `json:"storyTime" validate:"maxLen=50"`
	Weather   string `json:"weather" validate:"maxLen=50"`
}

func (h *BoardHandler) ListStoryPages(ctx iris.Context) {
	boardID := ctx.Params().GetString("board_id")

	board, err := h.boardSvc.GetBoard(ctx.Request().Context(), boardID)
	if err != nil {
		validator.NotFoundError(ctx, "board not found")
		return
	}

	storyPages, err := h.storyPageSvc.GetByBoardID(boardID)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	ctx.JSON(iris.Map{"code": 0, "data": storyPages, "_context": iris.Map{"board": board}})
}

func (h *BoardHandler) CreateStoryPage(ctx iris.Context) {
	boardID := ctx.Params().GetString("board_id")

	board, err := h.boardSvc.GetBoard(ctx.Request().Context(), boardID)
	if err != nil {
		validator.NotFoundError(ctx, "board not found")
		return
	}

	var req CreateStoryPageForBoardReq
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StopWithJSON(400, iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	storyPage, err := h.storyPageSvc.Create("", board.ProjectID, boardID, req.Title, req.Desc, req.StoryTime, req.Weather, req.SortOrder)
	if err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, storyPage)
}
