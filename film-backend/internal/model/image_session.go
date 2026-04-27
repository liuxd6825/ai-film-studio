package model

import "time"

// ImageSession 生图会话
// 用于管理 AI 生图任务的会话
type ImageSession struct {
	// ID 主键
	ID string `gorm:"type:varchar(50);primaryKey" json:"id"`
	// OrgID 组织ID
	OrgID string `gorm:"type:varchar(50);index" json:"orgId"`
	// ProjectID 项目ID
	ProjectID string `gorm:"type:varchar(50);index" json:"projectId"`
	// Name 名称
	Name string `gorm:"type:varchar(255);not null" json:"name"`
	// Status 状态（0=进行中, 1=已完成, 2=已取消）
	Status int `gorm:"type:int;default:0" json:"status"`
	// CreatedAt 创建时间
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"createdAt"`
	// UpdatedAt 更新时间
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updatedAt"`
}

// TableName 返回数据库表名
func (ImageSession) TableName() string {
	return "image_session"
}
