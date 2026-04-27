package model

import (
	"github.com/google/uuid"
)

type ModelCfg struct {
	ID           uuid.UUID `gorm:"type:char(36);primaryKey"`
	ProjectID    uuid.UUID `gorm:"type:char(36);index"`
	Provider     string    `gorm:"size:50"`
	ModelName    string    `gorm:"size:100"`
	EncryptedKey string    `gorm:"size:500"`
	BaseURL      string    `gorm:"size:500"`
	Settings     string    `gorm:"type:text"`
	Priority     int       `gorm:"default:0"`
	CreatedAt    int64     `gorm:"autoCreateTime"`
	UpdatedAt    int64     `gorm:"autoUpdateTime"`
}

func (ModelCfg) TableName() string { return "model_cfg" }
