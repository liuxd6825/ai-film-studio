package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type ProjectRepository struct {
	db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

func (r *ProjectRepository) Create(project *model.Project) error {
	return r.db.Create(project).Error
}

func (r *ProjectRepository) GetByID(id string) (*model.Project, error) {
	var project model.Project
	err := r.db.Where("id = ?", id).First(&project).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

func (r *ProjectRepository) List() ([]model.Project, error) {
	var projects []model.Project
	err := r.db.Find(&projects).Error
	return projects, err
}

func (r *ProjectRepository) GetByOrgID(orgID string) ([]model.Project, error) {
	var projects []model.Project
	err := r.db.Where("org_id = ?", orgID).Find(&projects).Error
	return projects, err
}

func (r *ProjectRepository) Update(project *model.Project) error {
	return r.db.Save(project).Error
}

func (r *ProjectRepository) Delete(id string) error {
	return r.db.Delete(&model.Project{}, "id = ?", id).Error
}
