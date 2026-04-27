package model

type ChatMessage struct {
	ID        string `gorm:"type:char(36);primaryKey"`
	SessionID string `gorm:"type:char(36);index"`
	ProjectID string `gorm:"type:char(36);index"`
	Role      string `gorm:"size:20"`
	Content   string `gorm:"type:text"`
	Thinking  string `gorm:"type:text"`
	Meta      string `gorm:"type:text"`
	CreatedAt int64  `gorm:"autoCreateTime"`
}

func (ChatMessage) TableName() string { return "chat_message" }
