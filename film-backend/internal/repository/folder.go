package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type FolderRepository struct {
	db *gorm.DB
}

func NewFolderRepository(db *gorm.DB) *FolderRepository {
	return &FolderRepository{db: db}
}

func (r *FolderRepository) Create(folder *model.Folder) error {
	return r.db.Create(folder).Error
}

func (r *FolderRepository) GetByID(id string) (*model.Folder, error) {
	var folder model.Folder
	err := r.db.Where("id = ?", id).First(&folder).Error
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

func (r *FolderRepository) GetByProjectID(projectID string) ([]model.Folder, error) {
	var folders []model.Folder
	err := r.db.Where("project_id = ?", projectID).Order("sort_order ASC, created_at ASC").Find(&folders).Error
	return folders, err
}

func (r *FolderRepository) Update(folder *model.Folder) error {
	return r.db.Save(folder).Error
}

func (r *FolderRepository) Delete(id string) error {
	return r.db.Delete(&model.Folder{}, "id = ?", id).Error
}

func (r *FolderRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.Folder{}, "project_id = ?", projectID).Error
}
