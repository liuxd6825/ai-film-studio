package handler

import (
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/chat"

	"github.com/kataras/iris/v12"
)

type ChatSessionHandler struct {
	chatSessionSvc *chat.ChatSessionService
}

func NewChatSessionHandler(chatSessionSvc *chat.ChatSessionService) *ChatSessionHandler {
	return &ChatSessionHandler{
		chatSessionSvc: chatSessionSvc,
	}
}

type ChatSessionCreateRequest struct {
	ProjectID string `json:"projectId" validate:"required"`
	Title     string `json:"title"`
	AgentID   string `json:"agentId"`
	AgentName string `json:"agentName"`
}

func (h *ChatSessionHandler) CreateSession(ctx iris.Context) {
	var req ChatSessionCreateRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	if validator.HandleValidation(ctx, validator.Validate(&req)) {
		return
	}

	title := req.Title
	if title == "" {
		title = "New Chat"
	}

	chatSession, err := h.chatSessionSvc.CreateSession(req.ProjectID, title, req.AgentID, req.AgentName)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, iris.Map{
		"id":        chatSession.ID,
		"agentId":   chatSession.AgentID,
		"agentName": chatSession.AgentName,
		"title":     chatSession.Title,
	})
}

func (h *ChatSessionHandler) ListSessions(ctx iris.Context) {
	projectID := ctx.URLParam("projectId")
	if projectID == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "projectId is required"})
		return
	}

	sessions, err := h.chatSessionSvc.ListSessionsByProjectID(projectID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	result := make([]map[string]interface{}, len(sessions))
	for i, s := range sessions {
		result[i] = map[string]interface{}{
			"id":        s.ID,
			"agentId":   s.AgentID,
			"agentName": s.AgentName,
			"title":     s.Title,
		}
	}
	validator.Success(ctx, result)
}

func (h *ChatSessionHandler) DeleteSession(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	if id == "" {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "id is required"})
		return
	}

	if err := h.chatSessionSvc.DeleteSession(id); err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	validator.SuccessWithMessage(ctx, "session deleted")
}

func (h *ChatSessionHandler) CreateConversation(ctx iris.Context) {
	agentID := ctx.Params().GetString("agent_id")
	var req struct {
		Title string `json:"title"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"error": "invalid request"})
		return
	}

	conv, err := h.chatSessionSvc.CreateConversation(agentID, req.Title)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, conv)
}

func (h *ChatSessionHandler) ListConversations(ctx iris.Context) {
	agentID := ctx.Params().GetString("agent_id")
	convs, err := h.chatSessionSvc.ListConversationsByAgentID(agentID)
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, convs)
}

func (h *ChatSessionHandler) GetConversation(ctx iris.Context) {
	id := ctx.Params().GetString("id")
	conv, err := h.chatSessionSvc.GetSession(id)
	if err != nil {
		validator.NotFoundError(ctx, "not found")
		return
	}
	validator.Success(ctx, conv)
}
