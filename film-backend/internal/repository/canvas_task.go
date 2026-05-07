package repository

import (
	"open-film-service/internal/ai/aioptions"
	"open-film-service/internal/model"

	"gorm.io/gorm"
)

type CanvasTaskRepository struct {
	db *gorm.DB
}

func NewCanvasTaskRepository(db *gorm.DB) *CanvasTaskRepository {
	return &CanvasTaskRepository{db: db}
}

func (r *CanvasTaskRepository) DB() *gorm.DB {
	return r.db
}

func (r *CanvasTaskRepository) Create(task *model.CanvasTask) error {
	return r.db.Create(task).Error
}

func (r *CanvasTaskRepository) GetByID(id string) (*model.CanvasTask, error) {
	var task model.CanvasTask
	err := r.db.Where("id = ?", id).First(&task).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *CanvasTaskRepository) Update(task *model.CanvasTask) error {
	return r.db.Save(task).Error
}

func (r *CanvasTaskRepository) UpdateStatus(id string, status aioptions.TaskStatus, resultURL string, resultData string, errorMessage string) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if resultURL != "" {
		updates["result_url"] = resultURL
	}
	if resultData != "" {
		updates["result_data"] = resultData
	}
	if errorMessage != "" {
		updates["error_message"] = errorMessage
	}
	return r.db.Model(&model.CanvasTask{}).Where("id = ?", id).Updates(updates).Error
}

func (r *CanvasTaskRepository) ListByNodeID(nodeID string) ([]*model.CanvasTask, error) {
	var tasks []*model.CanvasTask
	err := r.db.Where("node_id = ?", nodeID).Order("created_at DESC").Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *CanvasTaskRepository) ListByNodeIDPaginated(nodeID string, page, pageSize int) ([]*model.CanvasTask, int64, error) {
	var tasks []*model.CanvasTask
	var total int64

	err := r.db.Model(&model.CanvasTask{}).Where("node_id = ? AND status = ?", nodeID, aioptions.TaskStatusCompleted).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err = r.db.Where("node_id = ? AND status = ?", nodeID, aioptions.TaskStatusCompleted).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&tasks).Error
	if err != nil {
		return nil, 0, err
	}

	return tasks, total, nil
}

func (r *CanvasTaskRepository) ListByCanvasID(canvasID string) ([]*model.CanvasTask, error) {
	var tasks []*model.CanvasTask
	err := r.db.Where("canvas_id = ?", canvasID).Order("created_at DESC").Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *CanvasTaskRepository) ListPendingByProvider(provider string) ([]*model.CanvasTask, error) {
	var tasks []*model.CanvasTask
	err := r.db.Where("provider = ? AND status IN ?", provider, []int{int(aioptions.TaskStatusCompleted), int(aioptions.TaskStatusPending)}).
		Order("created_at ASC").
		Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *CanvasTaskRepository) Delete(id string) error {
	return r.db.Delete(&model.CanvasTask{}, "id = ?", id).Error
}
