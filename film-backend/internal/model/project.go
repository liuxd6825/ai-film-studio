package model

import (
	"encoding/json"

	"github.com/google/uuid"
)

type Project struct {
	ID              uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	OrgID           uuid.UUID `gorm:"type:char(36);index" json:"org_id"`
	Name            string    `gorm:"size:255;not null" json:"name"`
	Description     string    `gorm:"size:1024" json:"description"`
	Tags            string    `gorm:"type:text" json:"tags"`
	Status          int       `gorm:"default:0" json:"status"`
	Duration        string    `gorm:"size:50" json:"duration"`
	Style           string    `gorm:"size:50" json:"style"`
	Settings        string    `gorm:"type:text" json:"settings"`
	JimengWorkspace string    `gorm:"size:64" json:"jimeng_workspace"`
	CreatedAt       int64     `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       int64     `gorm:"autoUpdateTime" json:"updated_at"`
}

func (p *Project) GetTags() []string {
	if p.Tags == "" {
		return []string{}
	}
	var tags []string
	if err := json.Unmarshal([]byte(p.Tags), &tags); err != nil {
		return []string{}
	}
	return tags
}

func (p *Project) SetTags(tags []string) {
	if tags == nil {
		p.Tags = "[]"
		return
	}
	data, _ := json.Marshal(tags)
	p.Tags = string(data)
}

func (Project) TableName() string { return "project" }
