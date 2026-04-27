package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type MediaTaskRepository struct {
	db *gorm.DB
}

func NewMediaTaskRepository(db *gorm.DB) *MediaTaskRepository {
	return &MediaTaskRepository{db: db}
}

func (r *MediaTaskRepository) Create(task *model.MediaTask) error {
	return r.db.Create(task).Error
}

func (r *MediaTaskRepository) GetByID(id string) (*model.MediaTask, error) {
	var task model.MediaTask
	err := r.db.Where("id = ?", id).First(&task).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *MediaTaskRepository) ListByProjectID(projectID string, mediaType model.MediaType) ([]model.MediaTask, error) {
	var tasks []model.MediaTask
	query := r.db.Where("project_id = ?", projectID)
	if mediaType != "" {
		query = query.Where("media_type = ?", mediaType)
	}
	err := query.Find(&tasks).Error
	return tasks, err
}

func (r *MediaTaskRepository) Update(task *model.MediaTask) error {
	return r.db.Save(task).Error
}

func (r *MediaTaskRepository) Delete(id string) error {
	return r.db.Delete(&model.MediaTask{}, "id = ?", id).Error
}
