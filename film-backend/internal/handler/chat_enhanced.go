package handler

import (
	"errors"
	"io"
	"log"
	"open-film-service/internal/ai/infrastructure/agent"
	"open-film-service/internal/service/skill"
	"strings"

	"open-film-service/internal/pkg/validator"
	"open-film-service/internal/service/chat"

	"github.com/cloudwego/eino/adk"
	"github.com/cloudwego/eino/schema"
	"github.com/kataras/iris/v12"
)

type ChatStreamHandler struct {
	chatSvc     *chat.ChatService
	agentRunner *agent.AgentRunner
}

func NewChatStreamHandler(chatSvc *chat.ChatService, agentRunner *agent.AgentRunner) *ChatStreamHandler {
	return &ChatStreamHandler{
		chatSvc:     chatSvc,
		agentRunner: agentRunner,
	}
}

type ChatMessageRequest struct {
	Message         string `json:"message" validate:"required"`
	ProjectID       string `json:"projectId" validate:"required"`
	SessionId       string `json:"sessionId" validate:"required"`
	AgentId         string `json:"agentId"`
	IncludeThinking bool   `json:"includeThinking"`
	Files           []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"files"`
}

func (h *ChatStreamHandler) ChatMessage(ctx iris.Context) {
	if h.agentRunner == nil {
		ctx.StatusCode(500)
		ctx.JSON(iris.Map{"code": 500, "message": "agent runner not available"})
		return
	}

	var req ChatMessageRequest
	if err := ctx.ReadJSON(&req); err != nil {
		ctx.StatusCode(400)
		ctx.JSON(iris.Map{"code": 400, "message": "invalid request"})
		return
	}

	if validator.HandleValidation(ctx, validator.Validate(&req)) {
		return
	}

	sessionID := req.SessionId
	agentId := req.AgentId
	if agentId == "" {
		defaultAgent := h.agentRunner.GetDefaultAgent()
		if defaultAgent == nil {
			ctx.StatusCode(400)
			ctx.JSON(iris.Map{"code": 400, "message": "agent id is required"})
			return
		}
		agentId = defaultAgent.Id
	}

	if err := h.chatSvc.SaveMessage(req.ProjectID, sessionID, "user", req.Message, "", ""); err != nil {
		validator.InternalServerError(ctx, err)
		return
	}

	messages, err := h.getMessages(ctx, agentId, sessionID, req.Message)

	iterator, err := h.agentRunner.Execute(ctx.Request().Context(), agentId, req.ProjectID, messages)
	if err != nil {
		log.Printf("[StreamAgent] Execute error: %v", err)
		ctx.WriteString("data: {\"error\":\"" + err.Error() + "\"}\n\n")
		return
	}

	ctx.ContentType("text/event-stream")
	ctx.Header("Cache-Control", "no-cache")
	ctx.Header("Connection", "keep-alive")
	ctx.Header("X-Accel-Buffering", "no")
	ctx.StatusCode(200)
	req.IncludeThinking = true
	var fullResponse strings.Builder
	var streamWriter io.Writer
	if req.IncludeThinking {
		streamWriter = ctx.ResponseWriter()
	} else {
		streamWriter = agent.NewThinkingFilterWriter(ctx.ResponseWriter())
	}

	for {
		event, ok := iterator.Next()
		if !ok {
			break
		}

		// Process streaming output
		if event.Output != nil && event.Output.MessageOutput.IsStreaming {
			stream := event.Output.MessageOutput.MessageStream
			for {
				msg, err := stream.Recv()
				if err == io.EOF {
					break // Stream completed successfully
				}
				if err != nil {
					// Check if this error will be retried (more streams coming)
					var willRetry *adk.WillRetryError
					if errors.As(err, &willRetry) {
						log.Printf("Attempt %d failed, retrying...", willRetry.RetryAttempt)
						break // Wait for next event with new stream
					}
					// Original error - won't retry, agent will stop and the next AgentEvent probably will be an error
					log.Printf("Final error (no retry): %v", err)
					break
				}
				fullResponse.WriteString(msg.Content)
				streamWriter.Write([]byte(msg.Content))
				ctx.ResponseWriter().Flush()
			}
		}
	}

	fullContent := fullResponse.String()
	thinking := agent.GetThinking(&fullContent)
	if err := h.chatSvc.SaveMessage(req.ProjectID, sessionID, "assistant", fullContent, "", thinking); err != nil {
		log.Printf("[StreamAgent] Save error: %v", err)
	}

}

func (h *ChatStreamHandler) getMessages(ctx iris.Context, agentId, sessionID, newMessage string) ([]*schema.Message, error) {
	historyMessages, err := h.chatSvc.ListMessagesByConversationID(sessionID)
	if err != nil {
		log.Printf("[StreamAgent] Get messages error: %v", err)
		return nil, err
	}

	agentCfg, err := h.agentRunner.GetAgentConfig(ctx, agentId)
	if err != nil {
		log.Fatal(err.Error())
		return nil, err
	}

	var schemaMessages []*schema.Message
	agentMsg := &schema.Message{
		Role:    schema.Assistant,
		Content: agentCfg.Instructions,
	}
	schemaMessages = append(schemaMessages, agentMsg)

	for _, m := range historyMessages {
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

	// 在 req.Message 传递给 agent 之前处理
	if cmd := skill.ParseCommand(newMessage); cmd != nil {
		newMessage = cmd.ToInstruction()
		log.Printf("[SKILL] Command detected: /%s, args: %q", cmd.SkillName, cmd.Args)
	}

	userMsg := &schema.Message{
		Role:    schema.User,
		Content: newMessage,
	}
	schemaMessages = append(schemaMessages, userMsg)
	return schemaMessages, err
}
