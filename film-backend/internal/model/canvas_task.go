package model

import "time"

type CanvasTask struct {
	ID           string    `gorm:"type:varchar(64);primaryKey" json:"id"`
	CanvasID     string    `gorm:"type:varchar(64);index" json:"canvasId"`
	NodeID       string    `gorm:"type:varchar(64);index" json:"nodeId"`
	ProjectID    string    `gorm:"type:varchar(64);index" json:"projectId"`
	TaskType     string    `gorm:"size:50" json:"taskType"`
	Provider     string    `gorm:"size:50" json:"provider"`
	Model        string    `gorm:"size:100" json:"model"`
	Prompt       string    `gorm:"type:text" json:"prompt"`
	Params       string    `gorm:"type:text" json:"params"`
	Status       int       `gorm:"default:0" json:"status"`
	ResultID     string    `gorm:"type:varchar(64)" json:"resultId"`
	ResultURL    string    `gorm:"size:1024" json:"resultUrl"`
	ResultData   string    `gorm:"type:text" json:"resultData"`
	ErrorMessage string    `gorm:"size:1024" json:"errorMessage"`
	Progress     int       `gorm:"default:0" json:"progress"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (CanvasTask) TableName() string { return "canvas_task" }

const (
	TaskStatusPending    = 0
	TaskStatusProcessing = 1
	TaskStatusCompleted  = 2
	TaskStatusFailed     = 3
	TaskStatusCancelled  = 4
)
