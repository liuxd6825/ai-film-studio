package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type FileRepository struct {
	db *gorm.DB
}

func NewFileRepository(db *gorm.DB) *FileRepository {
	return &FileRepository{db: db}
}

func (r *FileRepository) Create(file *model.File) error {
	return r.db.Create(file).Error
}

func (r *FileRepository) GetByID(id string) (*model.File, error) {
	var file model.File
	err := r.db.Where("id = ?", id).First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *FileRepository) GetByProjectID(projectID string, folderID *string, allFiles bool) ([]model.File, error) {
	var files []model.File
	query := r.db.Where("project_id = ?", projectID)
	if !allFiles {
		if folderID != nil {
			query = query.Where("folder_id = ?", *folderID)
		} else {
			query = query.Where("folder_id IS NULL")
		}
	}
	err := query.Order("is_dir DESC, sort_order ASC, created_at ASC").Find(&files).Error
	return files, err
}

func (r *FileRepository) Update(file *model.File) error {
	return r.db.Save(file).Error
}

func (r *FileRepository) Delete(id string) error {
	return r.db.Delete(&model.File{}, "id = ?", id).Error
}

func (r *FileRepository) DeleteByProjectID(projectID string) error {
	return r.db.Delete(&model.File{}, "project_id = ?", projectID).Error
}
