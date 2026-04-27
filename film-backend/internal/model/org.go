package model

import (
	"github.com/google/uuid"
)

type Org struct {
	ID        uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Name      string    `gorm:"size:255;not null" json:"name"`
	Status    int       `gorm:"default:1" json:"status"`
	CreatedAt int64     `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt int64     `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Org) TableName() string { return "org" }
