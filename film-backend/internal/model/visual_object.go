package model

import "time"

// VisualObject 视觉物基类
// 包含角色、场景、道具的公共字段
type VisualObject struct {
	// ID 主键
	ID string `gorm:"type:varchar(50);primaryKey" json:"id"`
	// OrgID 组织ID
	OrgID string `gorm:"type:varchar(50);index" json:"orgId"`
	// ProjectID 项目ID
	ProjectID string `gorm:"type:varchar(50);index" json:"projectId"`
	// Name 名称
	Name string `gorm:"type:varchar(255);not null" json:"name"`
	// Desc 描述
	Desc string `gorm:"type:text" json:"desc"`
	// Kind 种类（character/scene/prop）
	Kind string `gorm:"type:varchar(20);not null;index" json:"kind"`
	// Type 类型（如主演/配角/内景/外景等）
	Type string `gorm:"type:varchar(50)" json:"type"`
	// Status 状态（0=草稿, 1=已批准, 2=已修订）
	Status int `gorm:"type:int;default:0" json:"status"`
	// CreatedAt 创建时间
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"createdAt"`
	// UpdatedAt 更新时间
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updatedAt"`
}
