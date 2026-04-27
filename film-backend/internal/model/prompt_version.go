package model

import (
	"time"

	"github.com/google/uuid"
)

type PromptVersion struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	PromptID  uuid.UUID `gorm:"type:char(36);index" json:"promptId"`
	Version   int       `gorm:"not null" json:"version"`
	Content   string    `gorm:"type:text" json:"content"`
	CreatedAt time.Time `gorm:"createdAt" json:"createdAt"`
	UpdatedAt time.Time `gorm:"createdAt" json:"updatedAt"`
}

func (PromptVersion) TableName() string { return "prompt_version" }
