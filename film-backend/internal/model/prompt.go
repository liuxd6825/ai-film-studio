package model

import (
	"time"

	"github.com/google/uuid"
)

type Prompt struct {
	ID         uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	ProjectID  uuid.UUID `gorm:"type:char(36);index" json:"projectId"`
	Title      string    `gorm:"size:255;not null" json:"title"`
	Content    string    `gorm:"type:text" json:"content"`
	CategoryKey string `gorm:"column:category_key;size:50" json:"categoryKey"`
	Tags       string    `gorm:"type:text" json:"tags"`
	Variables  string    `gorm:"type:text" json:"variables"`
	Version    int       `gorm:"default:1" json:"version"`
	IsLatest   bool      `gorm:"default:true" json:"isLatest"`
	CreatedAt  time.Time `gorm:"createdAt" json:"createdAt"`
	UpdatedAt  time.Time `gorm:"createdAt" json:"updatedAt"`
}

func (Prompt) TableName() string { return "prompt" }

type PromptVariable struct {
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	Description string   `json:"description"`
	Default     string   `json:"default,omitempty"`
	Options     []string `json:"options,omitempty"`
}
