package repository

import (
	"gorm.io/gorm"

	"open-film-service/internal/model"
)

type CanvasTaskResultRepository struct {
	db *gorm.DB
}

func NewCanvasTaskResultRepository(db *gorm.DB) *CanvasTaskResultRepository {
	return &CanvasTaskResultRepository{db: db}
}

func (r *CanvasTaskResultRepository) Create(result *model.CanvasTaskResult) error {
	return r.db.Create(result).Error
}

func (r *CanvasTaskResultRepository) CreateBatch(results []*model.CanvasTaskResult) error {
	return r.db.Create(results).Error
}

func (r *CanvasTaskResultRepository) GetByTaskID(taskID string) ([]*model.CanvasTaskResult, error) {
	var results []*model.CanvasTaskResult
	err := r.db.Where("task_id = ?", taskID).Order("created_at DESC").Find(&results).Error
	return results, err
}

func (r *CanvasTaskResultRepository) GetByID(id string) (*model.CanvasTaskResult, error) {
	var result model.CanvasTaskResult
	err := r.db.Where("id = ?", id).First(&result).Error
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (r *CanvasTaskResultRepository) DeleteByTaskID(taskID string) error {
	return r.db.Where("task_id = ?", taskID).Delete(&model.CanvasTaskResult{}).Error
}

func (r *CanvasTaskResultRepository) CountByNodeID(nodeID string) (int64, error) {
	var count int64
	err := r.db.Model(&model.CanvasTaskResult{}).Where("node_id = ?", nodeID).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}
