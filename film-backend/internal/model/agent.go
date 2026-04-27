package model

import (
	"encoding/json"
	"os"

	"github.com/google/uuid"
)

type Agent struct {
	ID           string `gorm:"type:char(36);primaryKey"`
	ProjectID    string `gorm:"type:char(36);index"`
	Name         string `gorm:"size:255;not null"`
	Description  string `gorm:"size:1024"`
	ModelCfgID   string `gorm:"type:char(36);index"`
	Skills       string `gorm:"type:text"`
	Instructions string `gorm:"type:text"`
	CreatedAt    int64  `gorm:"autoCreateTime"`
	UpdatedAt    int64  `gorm:"autoUpdateTime"`
}

func (Agent) TableName() string { return "agent" }

type AgentFileConfig struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	ModelCfgID   string `json:"modelCfgId"`
	Skills       string `json:"skills"`
	Instructions string `json:"instructions"`
}

func LoadAgentFromFile(path string) (*Agent, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg AgentFileConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	modelCfgID, err := uuid.Parse(cfg.ModelCfgID)
	if err != nil {
		modelCfgID = uuid.Nil
	}

	return &Agent{
		ID:           uuid.New().String(),
		ProjectID:    "",
		Name:         cfg.Name,
		Description:  cfg.Description,
		ModelCfgID:   modelCfgID.String(),
		Skills:       cfg.Skills,
		Instructions: cfg.Instructions,
	}, nil
}
