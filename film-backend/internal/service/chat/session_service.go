package chat

import (
	"open-film-service/internal/model"
	"open-film-service/internal/repository"

	"github.com/google/uuid"
)

type ChatSessionService struct {
	chatSessionRepo *repository.ChatSessionRepository
	chatMessageRepo *repository.ChatMessageRepository
	masterAgentPath string
}

func NewChatSessionService(
	chatSessionRepo *repository.ChatSessionRepository,
	chatMessageRepo *repository.ChatMessageRepository,
	masterAgentPath string,
) *ChatSessionService {
	return &ChatSessionService{
		chatSessionRepo: chatSessionRepo,
		chatMessageRepo: chatMessageRepo,
		masterAgentPath: masterAgentPath,
	}
}

func (s *ChatSessionService) CreateSession(projectID, title, agentID, agentName string) (*model.ChatSession, error) {
	projectUUID := normalizeToUUID(projectID)
	chatSession := &model.ChatSession{
		ID:        uuid.New().String(),
		AgentID:   agentID,
		AgentName: agentName,
		ProjectID: projectUUID.String(),
		Title:     title,
		Status:    1,
	}
	if err := s.chatSessionRepo.Create(chatSession); err != nil {
		return nil, err
	}
	return chatSession, nil
}

func (s *ChatSessionService) GetSession(id string) (*model.ChatSession, error) {
	return s.chatSessionRepo.GetByID(id)
}

func (s *ChatSessionService) ListSessionsByProjectID(projectID string) ([]model.ChatSession, error) {
	return s.chatSessionRepo.ListByProjectID(projectID)
}

func (s *ChatSessionService) DeleteSession(id string) error {
	if err := s.chatMessageRepo.DeleteBySessionID(id); err != nil {
		return err
	}
	return s.chatSessionRepo.Delete(id)
}

func (s *ChatSessionService) CreateConversation(agentID, title string) (*model.ChatSession, error) {
	chatSession := &model.ChatSession{
		ID:      uuid.New().String(),
		AgentID: agentID,
		Title:   title,
		Status:  1,
	}
	if err := s.chatSessionRepo.Create(chatSession); err != nil {
		return nil, err
	}
	return chatSession, nil
}

func (s *ChatSessionService) ListConversationsByAgentID(agentID string) ([]model.ChatSession, error) {
	return s.chatSessionRepo.ListByAgentID(agentID)
}
