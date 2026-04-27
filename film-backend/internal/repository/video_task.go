package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type VideoTaskRepository struct {
	db *gorm.DB
}

func NewVideoTaskRepository(db *gorm.DB) *VideoTaskRepository {
	return &VideoTaskRepository{db: db}
}

func (r *VideoTaskRepository) Create(task *model.VideoTask) error {
	return r.db.Create(task).Error
}

func (r *VideoTaskRepository) GetByID(id string) (*model.VideoTask, error) {
	var task model.VideoTask
	err := r.db.Where("id = ?", id).First(&task).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *VideoTaskRepository) ListByProjectID(projectID string) ([]model.VideoTask, error) {
	var tasks []model.VideoTask
	err := r.db.Where("project_id = ?", projectID).Find(&tasks).Error
	return tasks, err
}

func (r *VideoTaskRepository) Update(task *model.VideoTask) error {
	return r.db.Save(task).Error
}

func (r *VideoTaskRepository) Delete(id string) error {
	return r.db.Delete(&model.VideoTask{}, "id = ?", id).Error
}
