package model

import (
	"github.com/google/uuid"
)

type ExpertSession struct {
	ID         uuid.UUID `gorm:"type:char(36);primaryKey"`
	OrgID      string    `gorm:"size:36;index"`
	ExpertName string    `gorm:"size:255"`
	SessionID  string    `gorm:"size:36;uniqueIndex"`
	Title      string    `gorm:"size:255"`
	Messages   string    `gorm:"type:text"`
	CreatedAt  int64     `gorm:"autoCreateTime"`
	UpdatedAt  int64     `gorm:"autoUpdateTime"`
}

func (ExpertSession) TableName() string { return "expert_session" }

type SessionMessage struct {
	ID        string `json:"id"`
	Role      string `json:"role"`
	Content   string `json:"content"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

type CompressionConfig struct {
	Enabled        bool    `json:"enabled"`
	TriggerPercent float64 `json:"trigger_percent"`
	Strategy       string  `json:"strategy"`
	PreserveRecent int     `json:"preserve_recent"`
}

const (
	CompressionStrategySummarize = "summarize"
	CompressionStrategyTruncate  = "truncate"
	CompressionStrategyHybrid    = "hybrid"
)

var DefaultCompressionConfig = &CompressionConfig{
	Enabled:        true,
	TriggerPercent: 80.0,
	Strategy:       CompressionStrategySummarize,
	PreserveRecent: 5,
}
