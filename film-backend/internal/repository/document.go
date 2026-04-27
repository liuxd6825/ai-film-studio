package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type DocumentRepository struct {
	db *gorm.DB
}

func NewDocumentRepository(db *gorm.DB) *DocumentRepository {
	return &DocumentRepository{db: db}
}

func (r *DocumentRepository) Create(doc *model.Document) error {
	return r.db.Create(doc).Error
}

func (r *DocumentRepository) GetByID(id string) (*model.Document, error) {
	var doc model.Document
	err := r.db.Where("id = ?", id).First(&doc).Error
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

func (r *DocumentRepository) GetByProjectID(projectID string) ([]model.Document, error) {
	var docs []model.Document
	err := r.db.Where("project_id = ?", projectID).Order("sort_order ASC, created_at ASC").Find(&docs).Error
	return docs, err
}

func (r *DocumentRepository) Update(doc *model.Document) error {
	return r.db.Save(doc).Error
}

func (r *DocumentRepository) Delete(id string) error {
	return r.db.Delete(&model.Document{}, "id = ?", id).Error
}

func (r *DocumentRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.Document{}, "project_id = ?", projectID).Error
}
