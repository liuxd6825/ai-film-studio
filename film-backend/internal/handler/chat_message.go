package handler

import (
	"encoding/json"
	"open-film-service/internal/ai/agent"

	"github.com/cloudwego/eino/adk"
	"github.com/cloudwego/eino/schema"
	"github.com/kataras/iris/v12"

	"open-film-service/internal/model"
	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/chat"
)

type ChatMessageHandler struct {
	sessionSvc *chat.ChatSessionService
	messageSvc interface {
		CreateMessage(conversationID, role, content string) (*model.ChatMessage, error)
		GetMessage(id string) (*model.ChatMessage, error)
		ListMessagesByConversationID(conversationID string) ([]model.ChatMessage, error)
		UpdateMessage(id, content string) error
		DeleteMessage(id string) error
	}
	agentRunner *agent.AgentRunner
}

func NewChatMessageHandler(sessionSvc *chat.ChatSessionService, messageSvc interface {
	CreateMessage(conversationID, role, content string) (*model.ChatMessage, error)
	GetMessage(id string) (*model.ChatMessage, error)
	ListMessagesByConversationID(conversationID string) ([]model.ChatMessage, error)
	UpdateMessage(id, content string) error
	DeleteMessage(id string) error
}, agentRunner *agent.AgentRunner) *ChatMessageHandler {
	return &ChatMessageHandler{
		sessionSvc:  sessionSvc,
		messageSvc:  messageSvc,
		agentRunner: agentRunner,
	}
}

func (h *ChatMessageHandler) SendMessage(ctx iris.Context) {
	convID := ctx.Params().GetString("id")
	var req struct {
		Content string `json:"content"`
		Role    string `json:"role"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"error": "invalid request"})
		return
	}

	msg, err := h.messageSvc.CreateMessage(convID, req.Role, req.Content)
	if validator.InternalServerError(ctx, err) {
		return
	}

	ctx.StatusCode(201)
	validator.Success(ctx, msg)
}

func (h *ChatMessageHandler) GetMessages(ctx iris.Context) {
	convID := ctx.Params().GetString("id")
	messages, err := h.messageSvc.ListMessagesByConversationID(convID)
	if validator.InternalServerError(ctx, err) {
		return
	}
	validator.Success(ctx, messages)
}

func (h *ChatMessageHandler) Chat(ctx iris.Context) {
	if h.agentRunner == nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "agent runner not available"})
		return
	}

	var req struct {
		AgentName      string `json:"agentName"`
		Message        string `json:"message"`
		ConversationID string `json:"conversationId"`
		ProjectID      string `json:"projectId"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	agentName := req.AgentName
	if agentName == "" {
		defaultAgent := h.agentRunner.GetDefaultAgent()
		if defaultAgent == nil {
			ctx.StatusCode(400)
			ctx.JSON(iris.Map{"code": 400, "message": "agent name is required"})
			return
		}
		agentName = defaultAgent.Name
	}

	var convID string
	if req.ConversationID != "" {
		convID = req.ConversationID
	} else {
		conv, err := h.sessionSvc.CreateConversation(agentName, "New Chat")
		if validator.InternalServerError(ctx, err) {
			return
		}
		convID = conv.ID
	}

	existingMessages, err := h.messageSvc.ListMessagesByConversationID(convID)
	if validator.InternalServerError(ctx, err) {
		return
	}

	var schemaMessages []*schema.Message
	for _, m := range existingMessages {
		role := schema.User
		if m.Role == "assistant" {
			role = schema.Assistant
		} else if m.Role == "system" {
			role = schema.System
		}
		schemaMessages = append(schemaMessages, &schema.Message{
			Role:    role,
			Content: m.Content,
		})
	}

	userMsg := &schema.Message{
		Role:    schema.User,
		Content: req.Message,
	}
	schemaMessages = append(schemaMessages, userMsg)

	_, err = h.messageSvc.CreateMessage(convID, "user", req.Message)
	if validator.InternalServerError(ctx, err) {
		return
	}

	iterator, err := h.agentRunner.Execute(ctx.Request().Context(), agentName, req.ProjectID, schemaMessages)
	if err != nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": err.Error()})
		return
	}

	h.streamAgentEvents(ctx, convID, iterator)
}

func (h *ChatMessageHandler) streamAgentEvents(ctx iris.Context, convID string, iterator *adk.AsyncIterator[*adk.AgentEvent]) {
	ctx.ContentType("text/event-stream")
	ctx.Header("Cache-Control", "no-cache")
	ctx.Header("Connection", "keep-alive")

	var fullContent string
	for {
		event, ok := iterator.Next()
		if !ok {
			break
		}
		if event.Err != nil {
			data, _ := json.Marshal(map[string]interface{}{
				"type":    "error",
				"convId":  convID,
				"content": event.Err.Error(),
			})
			ctx.Writef("data: %s\n\n", data)
			return
		}

		data, _ := json.Marshal(map[string]interface{}{
			"type":   "event",
			"convId": convID,
			"event":  event,
		})
		ctx.Writef("data: %s\n\n", data)
	}

	if fullContent != "" {
		h.messageSvc.CreateMessage(convID, "assistant", fullContent)
	}

	doneData, _ := json.Marshal(map[string]interface{}{
		"type":    "done",
		"convId":  convID,
		"content": fullContent,
	})
	ctx.Writef("data: %s\n\n", doneData)
}

func (h *ChatMessageHandler) ChatSync(ctx iris.Context) {
	var req struct {
		AgentID        string `json:"agentId"`
		Message        string `json:"message"`
		ConversationID string `json:"conversationId"`
	}
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"error": "invalid request"})
		return
	}

	var convID string
	if req.ConversationID != "" {
		convID = req.ConversationID
	} else {
		conv, err := h.sessionSvc.CreateConversation(req.AgentID, "New Chat")
		if validator.InternalServerError(ctx, err) {
			return
		}
		convID = conv.ID
	}

	msg, err := h.messageSvc.CreateMessage(convID, "user", req.Message)
	if validator.InternalServerError(ctx, err) {
		return
	}

	validator.Success(ctx, iris.Map{
		"conversationId": convID,
		"message":        msg,
	})
}
