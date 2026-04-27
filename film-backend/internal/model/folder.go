package model

import (
	"github.com/google/uuid"
)

type Folder struct {
	ID        uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	ProjectID uuid.UUID  `gorm:"type:char(36);index" json:"projectId"`
	ParentID  *uuid.UUID `gorm:"type:char(36);index" json:"parentId"`
	Name      string     `gorm:"size:100;not null" json:"name"`
	SortOrder int        `gorm:"default:0" json:"sortOrder"`
	CreatedAt int64      `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt int64      `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Folder) TableName() string { return "folder" }
