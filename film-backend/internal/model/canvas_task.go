package model

import (
	"open-film-service/internal/ai/aioptions"
	"time"
)

type CanvasTask struct {
	ID           string               `gorm:"type:varchar(64);primaryKey" json:"id"`
	CanvasID     string               `gorm:"type:varchar(64);index" json:"canvasId"`
	NodeID       string               `gorm:"type:varchar(64);index" json:"nodeId"`
	ProjectID    string               `gorm:"type:varchar(64);index" json:"projectId"`
	Workspace    string               `gorm:"type:varchar(64)" json:"workspace"`
	TaskType     string               `gorm:"size:50" json:"taskType"`
	Provider     string               `gorm:"size:50" json:"provider"`
	Model        string               `gorm:"size:100" json:"model"`
	Prompt       string               `gorm:"type:text" json:"prompt"`
	Params       string               `gorm:"type:text" json:"params"`
	Status       aioptions.TaskStatus `gorm:"default:0" json:"status"`
	ResultID     string               `gorm:"type:varchar(64)" json:"resultId"`
	ResultURL    string               `gorm:"size:1024" json:"resultUrl"`
	ResultData   string               `gorm:"type:text" json:"resultData"`
	ErrorMessage string               `gorm:"size:1024" json:"errorMessage"`
	CreatedAt    time.Time            `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time            `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (CanvasTask) TableName() string { return "canvas_task" }

type TaskType string

const (
	TaskTypeImage = "image"
	TaskTypeVideo = "video"
)
