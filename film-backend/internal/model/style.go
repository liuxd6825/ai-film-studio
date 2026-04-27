package model

import (
	"github.com/google/uuid"
)

type Style struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Name      string    `gorm:"size:50;uniqueIndex;not null" json:"name"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt int64     `gorm:"autoCreateTime" json:"created_at"`
}

func (Style) TableName() string { return "style" }
