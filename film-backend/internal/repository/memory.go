package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type MemoryRepository struct {
	db *gorm.DB
}

func NewMemoryRepository(db *gorm.DB) *MemoryRepository {
	return &MemoryRepository{db: db}
}

func (r *MemoryRepository) Create(memory *model.Memory) error {
	return r.db.Create(memory).Error
}

func (r *MemoryRepository) GetBySession(projectID, sessionID string) (*model.Memory, error) {
	var memory model.Memory
	err := r.db.Where("project_id = ? AND session_id = ?", projectID, sessionID).First(&memory).Error
	if err != nil {
		return nil, err
	}
	return &memory, nil
}

func (r *MemoryRepository) Upsert(memory *model.Memory) error {
	return r.db.Where("project_id = ? AND session_id = ?", memory.ProjectID, memory.SessionID).
		Assign(model.Memory{Messages: memory.Messages, Metadata: memory.Metadata}).
		FirstOrCreate(memory).Error
}

func (r *MemoryRepository) Delete(id string) error {
	return r.db.Delete(&model.Memory{}, "id = ?", id).Error
}

func (r *MemoryRepository) GetByID(id string) (*model.Memory, error) {
	var memory model.Memory
	err := r.db.Where("id = ?", id).First(&memory).Error
	if err != nil {
		return nil, err
	}
	return &memory, nil
}

func (r *MemoryRepository) List(projectID string) ([]model.Memory, error) {
	var memories []model.Memory
	err := r.db.Where("project_id = ?", projectID).Find(&memories).Error
	return memories, err
}

func (r *MemoryRepository) Update(memory *model.Memory) error {
	return r.db.Save(memory).Error
}
