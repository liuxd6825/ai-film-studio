package model

// Scene 场景
// 继承自 VisualObject
type Scene struct {
	VisualObject
}

// TableName 返回数据库表名
func (Scene) TableName() string {
	return "scene"
}

// SceneResponse DTO for API responses with cover URL
type SceneResponse struct {
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

// ToSceneResponse converts Scene to SceneResponse with cover URL
func (s *Scene) ToSceneResponse(coverURL string) SceneResponse {
	return SceneResponse{
		ID:        s.ID,
		OrgID:     s.OrgID,
		ProjectID: s.ProjectID,
		Name:      s.Name,
		Desc:      s.Desc,
		Kind:      s.Kind,
		Type:      s.Type,
		Status:    s.Status,
		CoverURL:  coverURL,
		CreatedAt: s.CreatedAt.Unix(),
		UpdatedAt: s.UpdatedAt.Unix(),
	}
}
