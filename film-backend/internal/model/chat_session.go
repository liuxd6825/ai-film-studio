package model

type ChatSession struct {
	ID        string `gorm:"type:char(36);primaryKey" json:"id"`
	AgentID   string `gorm:"type:char(36);index" json:"agentId"`
	AgentName string `gorm:"size:255" json:"agentName"`
	ProjectID string `gorm:"type:char(36);index" json:"projectId"`
	Title     string `gorm:"size:255" json:"title"`
	Status    int    `gorm:"default:1" json:"status"`
	CreatedAt int64  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt int64  `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (ChatSession) TableName() string { return "chat_session" }
