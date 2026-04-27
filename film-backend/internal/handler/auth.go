package handler

import (
	"github.com/google/uuid"
	"github.com/kataras/iris/v12"
	"gorm.io/gorm"

	"open-film-service/internal/logging"
	"open-film-service/internal/pkg/password"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/repository"
)

type AuthHandler struct {
	userRepo *repository.UserRepository
}

func NewAuthHandler(userRepo *repository.UserRepository) *AuthHandler {
	return &AuthHandler{userRepo: userRepo}
}

type LoginRequest struct {
	Username string `json:"username" validate:"required,maxLen=255"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	ID       uuid.UUID `json:"id"`
	Username string    `json:"username"`
	OrgID    uuid.UUID `json:"org_id"`
}

func (h *AuthHandler) Login(ctx iris.Context) {
	req, ok := validator.ParseAndValidate[LoginRequest](ctx)
	if !ok {
		return
	}

	user, err := h.userRepo.GetByUsername(req.Username)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.StatusCode(401)
			ctx.JSON(iris.Map{"code": 401, "message": "invalid username or password"})
			return
		}
		logging.Error("failed to get user by name: ", err)
		if validator.InternalServerError(ctx, err) {
			return
		}
		return
	}

	if !password.CheckPassword(req.Password, user.PasswordHash) {
		ctx.StatusCode(401)
		ctx.JSON(iris.Map{"code": 401, "message": "invalid username or password"})
		return
	}

	logging.Info("Login success for user:", user.Username, "ID:", user.ID, "OrgID:", user.OrgID)
	ctx.JSON(iris.Map{
		"code": 0,
		"data": LoginResponse{
			ID:       user.ID,
			Username: user.Username,
			OrgID:    user.OrgID,
		},
	})
}
