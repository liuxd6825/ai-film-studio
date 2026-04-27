package chat

import (
	"crypto/sha256"
	"fmt"

	"github.com/google/uuid"

	appModel "open-film-service/internal/model"
	"open-film-service/internal/repository"
)

type ChatService struct {
	messageRepo *repository.ChatMessageRepository
}

func normalizeToUUID(id string) uuid.UUID {
	parsed, err := uuid.Parse(id)
	if err == nil {
		return parsed
	}
	hash := sha256.Sum256([]byte(id))
	return uuid.MustParse(fmt.Sprintf("%x", hash)[:32])
}

func NewChatService(
	messageRepo *repository.ChatMessageRepository,
) *ChatService {
	return &ChatService{
		messageRepo: messageRepo,
	}
}

func (s *ChatService) SaveMessage(projectID, sessionID, role, content, meta, thinking string) error {
	sessionUUID := normalizeToUUID(sessionID)
	projUUID := normalizeToUUID(projectID)

	return s.messageRepo.Create(&appModel.ChatMessage{
		ID:        uuid.New().String(),
		SessionID: sessionUUID.String(),
		ProjectID: projUUID.String(),
		Role:      role,
		Content:   content,
		Thinking:  thinking,
		Meta:      meta,
	})
}

func (s *ChatService) CreateMessage(conversationID, role, content string) (*appModel.ChatMessage, error) {
	conversationIDParsed, err := uuid.Parse(conversationID)
	if err != nil {
		return nil, err
	}
	message := &appModel.ChatMessage{
		ID:        uuid.New().String(),
		SessionID: conversationIDParsed.String(),
		Role:      role,
		Content:   content,
	}
	if err := s.messageRepo.Create(message); err != nil {
		return nil, err
	}
	return message, nil
}

func (s *ChatService) GetMessage(id string) (*appModel.ChatMessage, error) {
	return s.messageRepo.GetByID(id)
}

func (s *ChatService) ListMessagesByConversationID(conversationID string) ([]appModel.ChatMessage, error) {
	convUUID := normalizeToUUID(conversationID)
	return s.messageRepo.ListBySessionID(convUUID.String())
}

func (s *ChatService) UpdateMessage(id, content string) error {
	message, err := s.messageRepo.GetByID(id)
	if err != nil {
		return err
	}
	message.Content = content
	return s.messageRepo.Update(message)
}

func (s *ChatService) DeleteMessage(id string) error {
	return s.messageRepo.Delete(id)
}

type FileInfo struct {
	ID   string
	Name string
}

type ChatRequest struct {
	ProjectID      string
	ConversationID string
	SessionID      string
	Message        string
	Mode           string
	Files          []FileInfo
}

type ChatResponse struct {
	Message        string
	SessionID      string
	ConversationID string
}
