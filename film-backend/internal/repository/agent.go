package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type AgentRepository struct {
	db *gorm.DB
}

func NewAgentRepository(db *gorm.DB) *AgentRepository {
	return &AgentRepository{db: db}
}

func (r *AgentRepository) Create(agent *model.Agent) error {
	return r.db.Create(agent).Error
}

func (r *AgentRepository) GetByID(id string) (*model.Agent, error) {
	var agent model.Agent
	err := r.db.Where("id = ?", id).First(&agent).Error
	if err != nil {
		return nil, err
	}
	return &agent, nil
}

func (r *AgentRepository) ListByProjectID(projectID string) ([]model.Agent, error) {
	var agents []model.Agent
	err := r.db.Where("project_id = ?", projectID).Find(&agents).Error
	return agents, err
}

func (r *AgentRepository) Update(agent *model.Agent) error {
	return r.db.Save(agent).Error
}

func (r *AgentRepository) Delete(id string) error {
	return r.db.Delete(&model.Agent{}, "id = ?", id).Error
}
