package model

import "time"

type CanvasFile struct {
	ID          string    `gorm:"type:varchar(64);primaryKey" json:"id"`
	ProjectID   string    `gorm:"type:varchar(64);index" json:"project_id"`
	CanvasID    string    `gorm:"type:varchar(64);index" json:"canvas_id"`
	NodeID      string    `gorm:"type:varchar(64)" json:"node_id"`
	Name        string    `gorm:"size:255" json:"name"`
	FilePath    string    `gorm:"size:512" json:"file_path"`
	FileSize    int64     `gorm:"default:0" json:"file_size"`
	Ext         string    `gorm:"size:50" json:"ext"`
	ContentType string    `gorm:"size:100" json:"content_type"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (CanvasFile) TableName() string { return "canvas_file" }
