package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type ExpertSessionRepository struct {
	db *gorm.DB
}

func NewExpertSessionRepository(db *gorm.DB) *ExpertSessionRepository {
	return &ExpertSessionRepository{db: db}
}

func (r *ExpertSessionRepository) Create(session *model.ExpertSession) error {
	return r.db.Create(session).Error
}

func (r *ExpertSessionRepository) GetBySessionID(sessionID string) (*model.ExpertSession, error) {
	var session model.ExpertSession
	err := r.db.Where("session_id = ?", sessionID).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *ExpertSessionRepository) ListByExpert(orgID, expertName string) ([]model.ExpertSession, error) {
	var sessions []model.ExpertSession
	err := r.db.Where("org_id = ? AND expert_name = ?", orgID, expertName).
		Order("created_at DESC").
		Find(&sessions).Error
	return sessions, err
}

func (r *ExpertSessionRepository) Update(session *model.ExpertSession) error {
	return r.db.Save(session).Error
}

func (r *ExpertSessionRepository) Delete(sessionID string) error {
	return r.db.Where("session_id = ?", sessionID).Delete(&model.ExpertSession{}).Error
}

func (r *ExpertSessionRepository) UpdateTitle(sessionID, title string) error {
	return r.db.Model(&model.ExpertSession{}).
		Where("session_id = ?", sessionID).
		Update("title", title).Error
}

func (r *ExpertSessionRepository) UpdateMessages(sessionID, messages string) error {
	return r.db.Model(&model.ExpertSession{}).
		Where("session_id = ?", sessionID).
		Update("messages", messages).Error
}
