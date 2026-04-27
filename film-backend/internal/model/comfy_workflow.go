package model

type ComfyWorkflow struct {
	ID           string `gorm:"type:char(36);primaryKey"`
	ProjectID    string `gorm:"type:char(36);index"`
	Name         string `gorm:"size:255"`
	Description  string `gorm:"size:1024"`
	WorkflowJSON string `gorm:"type:text"`
	InputSchema  string `gorm:"type:text"`
	OutputSchema string `gorm:"type:text"`
	CreatedAt    int64  `gorm:"autoCreateTime"`
	UpdatedAt    int64  `gorm:"autoUpdateTime"`
}

func (ComfyWorkflow) TableName() string { return "comfy_workflow" }
