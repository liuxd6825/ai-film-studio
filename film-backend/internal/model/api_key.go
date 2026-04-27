package model

type APIKey struct {
	ID         string `gorm:"type:char(36);primaryKey"`
	OrgID      string `gorm:"type:char(36);index"`
	ProjectID  string `gorm:"type:char(36);index"`
	KeyHash    string `gorm:"size:64;uniqueIndex"`
	Name       string `gorm:"size:255"`
	Status     int    `gorm:"default:1"`
	LastUsedAt int64
	ExpiresAt  int64
	CreatedAt  int64 `gorm:"autoCreateTime"`
	UpdatedAt  int64 `gorm:"autoUpdateTime"`
}

const (
	APIKeyStatusActive   = 1
	APIKeyStatusInactive = 0
)

func (APIKey) TableName() string { return "api_key" }
