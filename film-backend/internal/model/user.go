package model

import (
	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	Username     string    `gorm:"size:255;uniqueIndex;not null" json:"username"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"` // never expose to frontend
	OrgID        uuid.UUID `gorm:"type:char(36);index" json:"org_id"`
	Status       int       `gorm:"default:1" json:"status"`
	CreatedAt    int64     `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    int64     `gorm:"autoUpdateTime" json:"updated_at"`
}

func (User) TableName() string { return "user" }
