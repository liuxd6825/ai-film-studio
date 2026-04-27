package model

import "time"

// Dictionary 字典表
// 用于存储系统枚举值，如剧情时间、天气、角色类型等
type Dictionary struct {
	// ID 主键
	ID string `gorm:"type:varchar(50);primaryKey" json:"id"`
	// OrgID 组织ID
	OrgID string `gorm:"type:varchar(50);index" json:"orgId"`
	// Category 字典类别（如 story_time, weather）
	Category string `gorm:"type:varchar(50);not null;index" json:"category"`
	// Key 字典键
	Key string `gorm:"type:varchar(100);not null" json:"key"`
	// Value 字典值
	Value string `gorm:"type:varchar(255);not null" json:"value"`
	// SortOrder 排序号
	SortOrder int `gorm:"type:int;default:0" json:"sortOrder"`
	// CreatedAt 创建时间
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"createdAt"`
	// UpdatedAt 更新时间
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updatedAt"`
}

// TableName 返回数据库表名
func (Dictionary) TableName() string {
	return "dictionary"
}
