package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type ChatSessionRepository struct {
	db *gorm.DB
}

func NewChatSessionRepository(db *gorm.DB) *ChatSessionRepository {
	return &ChatSessionRepository{db: db}
}

func (r *ChatSessionRepository) Create(session *model.ChatSession) error {
	return r.db.Create(session).Error
}

func (r *ChatSessionRepository) GetByID(id string) (*model.ChatSession, error) {
	var session model.ChatSession
	err := r.db.Where("id = ?", id).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *ChatSessionRepository) ListByAgentID(agentID string) ([]model.ChatSession, error) {
	var sessions []model.ChatSession
	err := r.db.Where("agent_id = ?", agentID).Find(&sessions).Error
	return sessions, err
}

func (r *ChatSessionRepository) ListByProjectID(projectID string) ([]model.ChatSession, error) {
	var sessions []model.ChatSession
	err := r.db.Where("project_id = ?", projectID).Find(&sessions).Error
	return sessions, err
}

func (r *ChatSessionRepository) Update(session *model.ChatSession) error {
	return r.db.Save(session).Error
}

func (r *ChatSessionRepository) Delete(id string) error {
	return r.db.Delete(&model.ChatSession{}, "id = ?", id).Error
}
