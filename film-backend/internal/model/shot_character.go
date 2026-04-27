package model

import "time"

// ShotCharacter 镜头-角色关联表
// 实现镜头与角色的多对多关系
type ShotCharacter struct {
	// ID 主键
	ID string `gorm:"type:varchar(50);primaryKey" json:"id"`
	// OrgID 组织ID
	OrgID string `gorm:"type:varchar(50);index" json:"orgId"`
	// ProjectID 项目ID
	ProjectID string `gorm:"type:varchar(50);index" json:"projectId"`
	// StoryPageID 所属故事页ID
	StoryPageID string `gorm:"type:varchar(50);index" json:"storyPageId"`
	// ShotID 镜头ID
	ShotID string `gorm:"type:varchar(50);index" json:"shotId"`
	// CharacterID 角色ID
	CharacterID string `gorm:"type:varchar(50);index" json:"characterId"`
	// CreatedAt 创建时间
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"createdAt"`
	// UpdatedAt 更新时间
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updatedAt"`
}

// TableName 返回数据库表名
func (ShotCharacter) TableName() string {
	return "shot_character"
}
