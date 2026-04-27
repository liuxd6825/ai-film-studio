package model

import "time"

type Canvas struct {
	ID        string    `gorm:"type:varchar(64);primaryKey" json:"id"`
	ProjectID string    `gorm:"type:varchar(64);index" json:"projectId"`
	Name      string    `gorm:"size:255" json:"name"`
	CreatorID string    `gorm:"size:64" json:"creatorId"`
	Nodes     string    `gorm:"type:text" json:"nodes"`
	Edges     string    `gorm:"type:text" json:"edges"`
	Viewport  string    `gorm:"type:text" json:"viewport"`
	History   string    `gorm:"type:text" json:"history"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Canvas) TableName() string { return "canvas" }
