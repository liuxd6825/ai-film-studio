package model

import (
	"time"

	"github.com/google/uuid"
)

type PromptCategory struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	ProjectID uuid.UUID `gorm:"type:char(36);index" json:"projectId"`
	Name      string    `gorm:"size:255;not null" json:"name"`
	CreatedAt time.Time `gorm:"createdAt" json:"createdAt"`
	UpdatedAt time.Time `gorm:"createdAt" json:"updatedAt"`
}

func (PromptCategory) TableName() string { return "prompt_category" }
