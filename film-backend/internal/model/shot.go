package model

import "time"

// Shot 镜头
// 故事页下的拍摄单元
type Shot struct {
	// ID 主键
	ID string `gorm:"type:varchar(50);primaryKey" json:"id"`
	// OrgID 组织ID
	OrgID string `gorm:"type:varchar(50);index" json:"orgId"`
	// ProjectID 项目ID
	ProjectID string `gorm:"type:varchar(50);index" json:"projectId"`
	// SessionID 生图会话ID（可选）
	SessionID *string `gorm:"type:varchar(50)" json:"sessionId"`
	// StoryPageID 所属故事页ID
	StoryPageID string `gorm:"type:varchar(50);index" json:"storyPageId"`

	// OrderNum 顺序号
	OrderNum int `gorm:"type:integer;default:0" json:"orderNum"`
	// SceneType 内外景
	SceneType string `gorm:"type:varchar(50)" json:"sceneType"`
	// Content 剧本内容
	Content string `gorm:"type:text" json:"content"`
	// TimeFrame 时间段
	TimeFrame string `gorm:"type:varchar(50)" json:"timeFrame"`
	// lighting 光影
	Lighting string `gorm:"type:varchar(50)" json:"lighting"`
	// Weather 天气
	Weather string `gorm:"type:varchar(50)" json:"weather"`
	// ShotType 画面类型
	ShotType string `gorm:"type:varchar(50)" json:"shotType"`
	// Duration 时长（秒）
	Duration int `gorm:"type:integer" json:"duration"`
	// CameraAngleH 水平机位
	CameraAngleH string `gorm:"type:varchar(50)" json:"cameraAngleH"`
	// CameraAngleV 垂直机位
	CameraAngleV string `gorm:"type:varchar(50)" json:"cameraAngleV"`
	// NarrativePov 叙事视点
	NarrativePov string `gorm:"type:varchar(50)" json:"narrativePov"`
	// CameraMovement 运镜方式
	CameraMovement string `gorm:"type:varchar(50)" json:"cameraMovement"`
	// Framing 景别
	Framing string `gorm:"type:varchar(50)" json:"framing"`
	// ActionEmotion 动作与情绪描述
	ActionEmotion string `gorm:"type:text" json:"actionEmotion"`
	// DialogueSound 对白或音效
	DialogueSound string `gorm:"type:text" json:"dialogueSound"`
	// Notes 拍摄备注
	Notes string `gorm:"type:text" json:"notes"`
	// State 状态
	State string `gorm:"type:varchar(50)" json:"state"`
	// CreatedAt 创建时间
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"createdAt"`
	// UpdatedAt 更新时间
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updatedAt"`
}

// TableName 返回数据库表名
func (Shot) TableName() string {
	return "shot"
}
