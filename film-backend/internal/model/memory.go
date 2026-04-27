package model

import (
	"github.com/google/uuid"
)

type Memory struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey"`
	ProjectID uuid.UUID `gorm:"type:char(36);index"`
	SessionID string    `gorm:"size:255;index"`
	Messages  string    `gorm:"type:text"`
	Metadata  string    `gorm:"type:text"`
	CreatedAt int64     `gorm:"autoCreateTime"`
	UpdatedAt int64     `gorm:"autoUpdateTime"`
}

func (Memory) TableName() string { return "memory" }
