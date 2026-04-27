package tools

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"

	"open-film-service/internal/logging"
	"open-film-service/internal/service/scene"
)

type SceneTools struct {
	sceneSvc *scene.Service
}

func NewSceneTools(sceneSvc *scene.Service) *SceneTools {
	return &SceneTools{
		sceneSvc: sceneSvc,
	}
}

func (t *SceneTools) Tools() []tool.BaseTool {
	return []tool.BaseTool{
		&sceneListTool{svc: t},
		&sceneSearchTool{svc: t},
		&sceneGetTool{svc: t},
		&sceneCreateTool{svc: t},
		&sceneUpdateTool{svc: t},
		&sceneDeleteTool{svc: t},
	}
}

type sceneListInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
}

type sceneListTool struct {
	svc *SceneTools
}

func (f *sceneListTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "scene_list",
		Desc: "列出项目中的所有场景",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
		}),
	}, nil
}

func (f *sceneListTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	logging.Info("=== sceneListTool.InvokableRun called ===")
	logging.Info(fmt.Sprintf("argumentsInJSON: %s", argumentsInJSON))

	var input sceneListInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		logging.Error(fmt.Sprintf("sceneListTool: failed to unmarshal: %v", err))
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	scenes, err := f.svc.sceneSvc.GetByProjectID(input.ProjectID)
	if err != nil {
		logging.Error(fmt.Sprintf("sceneListTool: failed to get scenes: %v", err))
		return "", err
	}

	logging.Info(fmt.Sprintf("sceneListTool: got %d scenes", len(scenes)))
	result, _ := json.Marshal(scenes)
	return string(result), nil
}

type sceneSearchInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
	Name      string `json:"name" jsonschema:"required"`
}

type sceneSearchTool struct {
	svc *SceneTools
}

func (f *sceneSearchTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "scene_search",
		Desc: "在项目中搜索场景名称，返回匹配的场景列表",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"name":       {Type: schema.String, Desc: "场景名称（支持模糊匹配）", Required: true},
		}),
	}, nil
}

func (f *sceneSearchTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	logging.Info("=== sceneSearchTool.InvokableRun called ===")
	logging.Info(fmt.Sprintf("argumentsInJSON: %s", argumentsInJSON))

	var input sceneSearchInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		logging.Error(fmt.Sprintf("sceneSearchTool: failed to unmarshal: %v", err))
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	scenes, err := f.svc.sceneSvc.GetByProjectID(input.ProjectID)
	if err != nil {
		logging.Error(fmt.Sprintf("sceneSearchTool: failed to get scenes: %v", err))
		return "", err
	}

	var matched []interface{}
	searchName := strings.ToLower(input.Name)
	for _, s := range scenes {
		if strings.Contains(strings.ToLower(s.Name), searchName) {
			matched = append(matched, s)
		}
	}

	logging.Info(fmt.Sprintf("sceneSearchTool: found %d matching scenes", len(matched)))
	result, _ := json.Marshal(matched)
	return string(result), nil
}

type sceneGetInput struct {
	ID string `json:"id" jsonschema:"required"`
}

type sceneGetTool struct {
	svc *SceneTools
}

func (f *sceneGetTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "scene_get",
		Desc: "获取指定场景的详细信息",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"id": {Type: schema.String, Desc: "场景ID", Required: true},
		}),
	}, nil
}

func (f *sceneGetTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input sceneGetInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	sc, err := f.svc.sceneSvc.GetByID(input.ID)
	if err != nil {
		if errors.Is(err, scene.ErrNotFound) {
			return "", errors.New("scene not found")
		}
		return "", err
	}

	result, _ := json.Marshal(sc)
	return string(result), nil
}

type sceneCreateInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
	Name      string `json:"name" jsonschema:"required"`
	Desc      string `json:"desc,omitempty"`
	Type      string `json:"type,omitempty"`
}

type sceneCreateTool struct {
	svc *SceneTools
}

func (f *sceneCreateTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "scene_create",
		Desc: "创建新场景",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"name":       {Type: schema.String, Desc: "场景名称", Required: true},
			"desc":       {Type: schema.String, Desc: "场景描述", Required: false},
			"type":       {Type: schema.String, Desc: "场景类型", Required: false},
		}),
	}, nil
}

func (f *sceneCreateTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input sceneCreateInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	created, err := f.svc.sceneSvc.Create("", input.ProjectID, input.Name, input.Desc, input.Type)
	if err != nil {
		return "", err
	}

	result, _ := json.Marshal(created)
	return string(result), nil
}

type sceneUpdateInput struct {
	ID   string `json:"id" jsonschema:"required"`
	Name string `json:"name,omitempty"`
	Desc string `json:"desc,omitempty"`
	Type string `json:"type,omitempty"`
}

type sceneUpdateTool struct {
	svc *SceneTools
}

func (f *sceneUpdateTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "scene_update",
		Desc: "更新场景信息",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"id":   {Type: schema.String, Desc: "场景ID", Required: true},
			"name": {Type: schema.String, Desc: "场景名称", Required: false},
			"desc": {Type: schema.String, Desc: "场景描述", Required: false},
			"type": {Type: schema.String, Desc: "场景类型", Required: false},
		}),
	}, nil
}

func (f *sceneUpdateTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input sceneUpdateInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	existing, err := f.svc.sceneSvc.GetByID(input.ID)
	if err != nil {
		if errors.Is(err, scene.ErrNotFound) {
			return "", errors.New("scene not found")
		}
		return "", err
	}

	updated, err := f.svc.sceneSvc.Update(input.ID, input.Name, input.Desc, input.Type, existing.Status)
	if err != nil {
		return "", err
	}

	result, _ := json.Marshal(updated)
	return string(result), nil
}

type sceneDeleteInput struct {
	ID string `json:"id" jsonschema:"required"`
}

type sceneDeleteTool struct {
	svc *SceneTools
}

func (f *sceneDeleteTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "scene_delete",
		Desc: "删除指定场景",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"id": {Type: schema.String, Desc: "场景ID", Required: true},
		}),
	}, nil
}

func (f *sceneDeleteTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input sceneDeleteInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	if err := f.svc.sceneSvc.Delete(input.ID); err != nil {
		if errors.Is(err, scene.ErrNotFound) {
			return "", errors.New("scene not found")
		}
		return "", err
	}

	return `{"deleted": true}`, nil
}
