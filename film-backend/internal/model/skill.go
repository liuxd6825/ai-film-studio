package model

import (
	"github.com/google/uuid"
)

type Skill struct {
	ID           uuid.UUID `gorm:"type:char(36);primaryKey"`
	ProjectID    uuid.UUID `gorm:"type:char(36);index"`
	Name         string    `gorm:"size:255;not null"`
	Description  string    `gorm:"size:1024"`
	Type         string    `gorm:"size:50"`
	Config       string    `gorm:"type:text"`
	Instructions string    `gorm:"type:text"`
	CreatedAt    int64     `gorm:"autoCreateTime"`
	UpdatedAt    int64     `gorm:"autoUpdateTime"`
}

func (Skill) TableName() string { return "skill" }

type SystemSkill struct {
	ID           string                    `json:"id"`
	Name         string                    `json:"name"`
	Description  string                    `json:"description"`
	Type         string                    `json:"type"`
	Instructions string                    `json:"instructions"`
	Parameters   map[string]SkillParameter `json:"parameters"`
	Source       string                    `json:"source"`
}

type SkillParameter struct {
	Type        string `json:"type"`
	Description string `json:"description"`
	Required    bool   `json:"required"`
	Default     string `json:"default,omitempty"`
}
