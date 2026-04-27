package model

import "time"

// VisualImage 视觉图
// 用于存储角色、场景、道具的参考图
type VisualImage struct {
	// ID 主键
	ID string `gorm:"type:varchar(50);primaryKey" json:"id"`
	// OrgID 组织ID
	OrgID string `gorm:"type:varchar(50);index" json:"orgId"`
	// ProjectID 项目ID
	ProjectID string `gorm:"type:varchar(50);index" json:"projectId"`
	// VisualObjectID 关联的视觉物ID（可选）
	VisualObjectID *string `gorm:"type:varchar(50);index" json:"visualObjectId"`
	// Name 名称
	Name string `gorm:"type:varchar(255);not null" json:"name"`
	// Desc 描述
	Desc string `gorm:"type:text" json:"desc"`
	// URL 图片地址
	URL string `gorm:"type:varchar(500)" json:"url"`
	// Thumbnail 缩略图地址
	Thumbnail string `gorm:"type:varchar(500)" json:"thumbnail"`
	// IsCover 是否设为封面
	IsCover bool `gorm:"type:boolean;default:false;index" json:"isCover"`
	// CreatedAt 创建时间
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"createdAt"`
	// UpdatedAt 更新时间
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updatedAt"`
}

// TableName 返回数据库表名
func (VisualImage) TableName() string {
	return "visual_image"
}
