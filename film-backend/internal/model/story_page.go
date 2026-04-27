package model

import (
	"time"

	"github.com/google/uuid"
)

// StoryPage 故事页
// 剧本的基本叙事单元
type StoryPage struct {
	// ID 主键
	ID string `gorm:"type:varchar(50);primaryKey" json:"id"`
	// BoardID 看板ID
	BoardID uuid.UUID `gorm:"type:char(36);index" json:"boardId"`
	// OrgID 组织ID
	OrgID string `gorm:"type:varchar(50);index" json:"orgId"`
	// ProjectID 项目ID
	ProjectID string `gorm:"type:varchar(50);index" json:"projectId"`
	// Title 标题
	Title string `gorm:"type:varchar(255);not null" json:"title"`
	// Desc 描述
	Desc string `gorm:"type:text" json:"desc"`
	// SortOrder 顺序号
	SortOrder int `gorm:"type:int;default:0" json:"sortOrder"`
	// Status 状态（0=草稿, 1=进行中, 2=已完成）
	Status int `gorm:"type:int;default:0" json:"status"`
	// StoryTime 剧情时间
	StoryTime string `gorm:"type:varchar(50)" json:"storyTime"`
	// Weather 天气
	Weather string `gorm:"type:varchar(50)" json:"weather"`
	// CreatedAt 创建时间
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"createdAt"`
	// UpdatedAt 更新时间
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updatedAt"`
}

// TableName 返回数据库表名
func (StoryPage) TableName() string {
	return "story_page"
}
