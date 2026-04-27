package model

import "time"

type CanvasTaskResult struct {
	ID           string    `gorm:"type:varchar(64);primaryKey" json:"id"`
	TaskID       string    `gorm:"type:varchar(64);index" json:"taskId"`
	NodeID       string    `gorm:"type:varchar(64);index" json:"nodeId"`
	ResultID     string    `gorm:"type:varchar(64)" json:"resultId"`
	URL          string    `gorm:"type:varchar(1024)" json:"url"`
	Name         string    `gorm:"size:255" json:"name"`
	Size         int64     `gorm:"default:0" json:"size"`
	MimeType     string    `gorm:"size:100" json:"mimeType"`
	Width        int       `gorm:"default:0" json:"width"`
	Height       int       `gorm:"default:0" json:"height"`
	Duration     int       `gorm:"default:0" json:"duration"`
	ThumbnailURL string    `gorm:"type:varchar(1024)" json:"thumbnailUrl"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

func (CanvasTaskResult) TableName() string { return "canvas_task_result" }
