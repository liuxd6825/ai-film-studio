package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type CanvasFileRepository struct {
	db *gorm.DB
}

func NewCanvasFileRepository(db *gorm.DB) *CanvasFileRepository {
	return &CanvasFileRepository{db: db}
}

func (r *CanvasFileRepository) Create(file *model.CanvasFile) error {
	return r.db.Create(file).Error
}

func (r *CanvasFileRepository) GetByID(id string) (*model.CanvasFile, error) {
	var file model.CanvasFile
	err := r.db.Where("id = ?", id).First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *CanvasFileRepository) GetByNodeID(nodeID string) (*model.CanvasFile, error) {
	var file model.CanvasFile
	err := r.db.Where("node_id = ?", nodeID).First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *CanvasFileRepository) Delete(id string) error {
	return r.db.Delete(&model.CanvasFile{}, "id = ?", id).Error
}

func (r *CanvasFileRepository) DeleteByNodeID(nodeID string) error {
	return r.db.Delete(&model.CanvasFile{}, "node_id = ?", nodeID).Error
}

func (r *CanvasFileRepository) UpdateFilePath(id, filePath string) error {
	return r.db.Model(&model.CanvasFile{}).Where("id = ?", id).Update("file_path", filePath).Error
}

func (r *CanvasFileRepository) ListAll() ([]*model.CanvasFile, error) {
	var files []*model.CanvasFile
	err := r.db.Find(&files).Error
	if err != nil {
		return nil, err
	}
	return files, nil
}

func (r *CanvasFileRepository) CountByNodeID(nodeID string) (int64, error) {
	var count int64
	err := r.db.Model(&model.CanvasFile{}).Where("node_id = ?", nodeID).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}
