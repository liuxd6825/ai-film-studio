package model

import (
	"github.com/google/uuid"
)

type MediaType string

const (
	MediaTypeText  MediaType = "text"
	MediaTypeImage MediaType = "image"
	MediaTypeVideo MediaType = "video"
	MediaTypeAudio MediaType = "audio"
)

type MediaTask struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey"`
	ProjectID uuid.UUID `gorm:"type:char(36);index"`
	MediaType MediaType `gorm:"size:20;not null"`
	Type      string    `gorm:"size:50"`
	Prompt    string    `gorm:"type:text"`
	Params    string    `gorm:"type:text"`
	Status    int       `gorm:"default:0"`
	ResultURL string    `gorm:"size:1024"`
	CreatedAt int64     `gorm:"autoCreateTime"`
}

func (MediaTask) TableName() string { return "media_task" }
