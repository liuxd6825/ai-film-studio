package model

// Prop 道具
// 继承自 VisualObject
type Prop struct {
	VisualObject
}

// TableName 返回数据库表名
func (Prop) TableName() string {
	return "prop"
}

// PropResponse DTO for API responses with cover URL
type PropResponse struct {
	ID        string `json:"id"`
	OrgID     string `json:"orgId"`
	ProjectID string `json:"projectId"`
	Name      string `json:"name"`
	Desc      string `json:"desc"`
	Kind      string `json:"kind"`
	Type      string `json:"type"`
	Status    int    `json:"status"`
	CoverURL  string `json:"coverUrl,omitempty"`
	CreatedAt int64  `json:"createdAt"`
	UpdatedAt int64  `json:"updatedAt"`
}

// ToPropResponse converts Prop to PropResponse with cover URL
func (p *Prop) ToPropResponse(coverURL string) PropResponse {
	return PropResponse{
		ID:        p.ID,
		OrgID:     p.OrgID,
		ProjectID: p.ProjectID,
		Name:      p.Name,
		Desc:      p.Desc,
		Kind:      p.Kind,
		Type:      p.Type,
		Status:    p.Status,
		CoverURL:  coverURL,
		CreatedAt: p.CreatedAt.Unix(),
		UpdatedAt: p.UpdatedAt.Unix(),
	}
}
