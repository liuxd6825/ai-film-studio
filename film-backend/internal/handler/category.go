package handler

import (
	"github.com/kataras/iris/v12"

	"open-film-service/internal/model"
)

type CategoryHandler struct{}

func NewCategoryHandler() *CategoryHandler {
	return &CategoryHandler{}
}

func (h *CategoryHandler) List(ctx iris.Context) {
	ctx.JSON(iris.Map{
		"code": 200,
		"data": model.AllPromptCategories,
	})
}
