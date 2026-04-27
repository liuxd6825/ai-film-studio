package memory

import (
	"encoding/json"
	"github.com/google/uuid"
	"open-film-service/internal/model"
	"open-film-service/internal/repository"
)

type Manager struct {
	repo *repository.MemoryRepository
}

func NewManager(repo *repository.MemoryRepository) *Manager {
	return &Manager{repo: repo}
}

func (m *Manager) LoadSession(projectID, sessionID string) ([]*model.ChatMessage, error) {
	memory, err := m.repo.GetBySession(projectID, sessionID)
	if err != nil {
		return nil, err
	}

	var messages []*model.ChatMessage
	if err := json.Unmarshal([]byte(memory.Messages), &messages); err != nil {
		return nil, err
	}
	return messages, nil
}

func (m *Manager) SaveSession(projectID, sessionID string, messages []*model.ChatMessage) error {
	msgJSON, err := json.Marshal(messages)
	if err != nil {
		return err
	}

	var projectUUID uuid.UUID
	if projectID != "" {
		projectUUID, err = uuid.Parse(projectID)
		if err != nil {
			return err
		}
	} else {
		projectUUID = uuid.Nil
	}

	mem := &model.Memory{
		ID:        uuid.New(), // 显式生成 UUID
		ProjectID: projectUUID,
		SessionID: sessionID,
		Messages:  string(msgJSON),
	}
	return m.repo.Upsert(mem)
}

func (m *Manager) AddMessage(projectID, sessionID string, msg *model.ChatMessage) error {
	messages, err := m.LoadSession(projectID, sessionID)
	if err != nil {
		return err
	}
	messages = append(messages, msg)
	return m.SaveSession(projectID, sessionID, messages)
}

func (m *Manager) ClearSession(projectID, sessionID string) error {
	mem, err := m.repo.GetBySession(projectID, sessionID)
	if err != nil {
		return err
	}
	return m.repo.Delete(mem.ID.String())
}
