package repository

import (
	"gorm.io/gorm"
	"open-film-service/internal/model"
)

type SkillRepository struct {
	db *gorm.DB
}

func NewSkillRepository(db *gorm.DB) *SkillRepository {
	return &SkillRepository{db: db}
}

func (r *SkillRepository) Create(skill *model.Skill) error {
	return r.db.Create(skill).Error
}

func (r *SkillRepository) GetByID(id string) (*model.Skill, error) {
	var skill model.Skill
	err := r.db.Where("id = ?", id).First(&skill).Error
	if err != nil {
		return nil, err
	}
	return &skill, nil
}

func (r *SkillRepository) ListByProjectID(projectID string) ([]model.Skill, error) {
	var skills []model.Skill
	err := r.db.Where("project_id = ?", projectID).Find(&skills).Error
	return skills, err
}

func (r *SkillRepository) Update(skill *model.Skill) error {
	return r.db.Save(skill).Error
}

func (r *SkillRepository) Delete(id string) error {
	return r.db.Delete(&model.Skill{}, "id = ?", id).Error
}
