package repository

import (
	"log"

	"open-film-service/internal/model"

	"gorm.io/gorm"
)

type ChatMessageRepository struct {
	db *gorm.DB
}

func NewChatMessageRepository(db *gorm.DB) *ChatMessageRepository {
	return &ChatMessageRepository{db: db}
}

func (r *ChatMessageRepository) Create(msg *model.ChatMessage) error {
	log.Printf("[ChatMessageRepository] Creating message: %+v", msg)
	err := r.db.Create(msg).Error
	if err != nil {
		log.Printf("[ChatMessageRepository] Create error: %v", err)
	}
	return err
}

func (r *ChatMessageRepository) ListBySessionID(sessionID string) ([]model.ChatMessage, error) {
	var messages []model.ChatMessage
	err := r.db.Where("session_id = ?", sessionID).Find(&messages).Error
	return messages, err
}

func (r *ChatMessageRepository) GetByID(id string) (*model.ChatMessage, error) {
	var msg model.ChatMessage
	err := r.db.Where("id = ?", id).First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

func (r *ChatMessageRepository) Update(msg *model.ChatMessage) error {
	return r.db.Save(msg).Error
}

func (r *ChatMessageRepository) Delete(id string) error {
	return r.db.Delete(&model.ChatMessage{}, "id = ?", id).Error
}

func (r *ChatMessageRepository) DeleteBySessionID(conversationID string) error {
	return r.db.Delete(&model.ChatMessage{}, "session_id = ?", conversationID).Error
}
