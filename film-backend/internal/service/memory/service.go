package memory

import (
	"errors"
	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

var ErrInvalidUUID = errors.New("invalid UUID format")

func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

type Service struct {
	repo *repository.MemoryRepository
}

func NewService(repo *repository.MemoryRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(projectID, sessionID, messages, metadata string) (*model.Memory, error) {
	projectIDParsed, err := parseUUID(projectID)
	if err != nil {
		return nil, ErrInvalidUUID
	}
	memory := &model.Memory{
		ID:        uuid.New(),
		ProjectID: projectIDParsed,
		SessionID: sessionID,
		Messages:  messages,
		Metadata:  metadata,
	}
	if err := s.repo.Create(memory); err != nil {
		return nil, err
	}
	return memory, nil
}

func (s *Service) GetBySession(projectID, sessionID string) (*model.Memory, error) {
	return s.repo.GetBySession(projectID, sessionID)
}

func (s *Service) GetByID(id string) (*model.Memory, error) {
	return s.repo.GetByID(id)
}

func (s *Service) List(projectID string) ([]model.Memory, error) {
	return s.repo.List(projectID)
}

func (s *Service) Upsert(projectID, sessionID, messages, metadata string) error {
	projectIDParsed, err := parseUUID(projectID)
	if err != nil {
		return ErrInvalidUUID
	}
	memory := &model.Memory{
		ID:        uuid.New(),
		ProjectID: projectIDParsed,
		SessionID: sessionID,
		Messages:  messages,
		Metadata:  metadata,
	}
	return s.repo.Upsert(memory)
}

func (s *Service) Update(id, messages, metadata string) error {
	memory, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if messages != "" {
		memory.Messages = messages
	}
	if metadata != "" {
		memory.Metadata = metadata
	}
	return s.repo.Update(memory)
}

func (s *Service) Delete(id string) error {
	return s.repo.Delete(id)
}
