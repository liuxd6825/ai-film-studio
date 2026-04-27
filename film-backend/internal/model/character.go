package model

// Character 角色
// 继承自 VisualObject
type Character struct {
	VisualObject
	Appearance  string `gorm:"type:text" json:"appearance"`
	Personality string `gorm:"type:text" json:"personality"`
	Background  string `gorm:"type:text" json:"background"`
	Abilities   string `gorm:"type:text" json:"abilities"`
	Faction     string `gorm:"type:varchar(255)" json:"faction"`
}

// TableName 返回数据库表名
func (Character) TableName() string {
	return "character"
}

// CharacterResponse DTO for API responses with cover URL
type CharacterResponse struct {
	ID          string `json:"id"`
	OrgID       string `json:"orgId"`
	ProjectID   string `json:"projectId"`
	Name        string `json:"name"`
	Desc        string `json:"desc"`
	Kind        string `json:"kind"`
	Type        string `json:"type"`
	Status      int    `json:"status"`
	Appearance  string `json:"appearance"`
	Personality string `json:"personality"`
	Background  string `json:"background"`
	Abilities   string `json:"abilities"`
	Faction     string `json:"faction"`
	CoverURL    string `json:"coverUrl,omitempty"`
	CreatedAt   int64  `json:"createdAt"`
	UpdatedAt   int64  `json:"updatedAt"`
}

// ToCharacterResponse converts Character to CharacterResponse with cover URL
func (c *Character) ToCharacterResponse(coverURL string) CharacterResponse {
	return CharacterResponse{
		ID:          c.ID,
		OrgID:       c.OrgID,
		ProjectID:   c.ProjectID,
		Name:        c.Name,
		Desc:        c.Desc,
		Kind:        c.Kind,
		Type:        c.Type,
		Status:      c.Status,
		Appearance:  c.Appearance,
		Personality: c.Personality,
		Background:  c.Background,
		Abilities:   c.Abilities,
		Faction:     c.Faction,
		CoverURL:    coverURL,
		CreatedAt:   c.CreatedAt.Unix(),
		UpdatedAt:   c.UpdatedAt.Unix(),
	}
}
