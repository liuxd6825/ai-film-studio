package model

import (
	"github.com/google/uuid"
)

type ImageTask struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey"`
	ProjectID uuid.UUID `gorm:"type:char(36);index"`
	Type      string    `gorm:"size:50"`
	Prompt    string    `gorm:"type:text"`
	Params    string    `gorm:"type:text"`
	Status    int       `gorm:"default:0"`
	ResultURL string    `gorm:"size:1024"`
	CreatedAt int64     `gorm:"autoCreateTime"`
}

func (ImageTask) TableName() string { return "image_task" }
