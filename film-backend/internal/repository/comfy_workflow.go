package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type ComfyWorkflowRepository struct {
	db *gorm.DB
}

func NewComfyWorkflowRepository(db *gorm.DB) *ComfyWorkflowRepository {
	return &ComfyWorkflowRepository{db: db}
}

func (r *ComfyWorkflowRepository) Create(workflow *model.ComfyWorkflow) error {
	return r.db.Create(workflow).Error
}

func (r *ComfyWorkflowRepository) GetByID(id string) (*model.ComfyWorkflow, error) {
	var workflow model.ComfyWorkflow
	err := r.db.Where("id = ?", id).First(&workflow).Error
	if err != nil {
		return nil, err
	}
	return &workflow, nil
}

func (r *ComfyWorkflowRepository) ListByProjectID(projectID string) ([]model.ComfyWorkflow, error) {
	var workflows []model.ComfyWorkflow
	err := r.db.Where("project_id = ?", projectID).Find(&workflows).Error
	return workflows, err
}

func (r *ComfyWorkflowRepository) Update(workflow *model.ComfyWorkflow) error {
	return r.db.Save(workflow).Error
}

func (r *ComfyWorkflowRepository) Delete(id string) error {
	return r.db.Delete(&model.ComfyWorkflow{}, "id = ?", id).Error
}
