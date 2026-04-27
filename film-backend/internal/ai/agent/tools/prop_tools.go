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
	"open-film-service/internal/service/prop"
)

type PropTools struct {
	propSvc *prop.Service
}

func NewPropTools(propSvc *prop.Service) *PropTools {
	return &PropTools{
		propSvc: propSvc,
	}
}

func (t *PropTools) Tools() []tool.BaseTool {
	return []tool.BaseTool{
		&propListTool{svc: t},
		&propSearchTool{svc: t},
		&propGetTool{svc: t},
		&propCreateTool{svc: t},
		&propUpdateTool{svc: t},
		&propDeleteTool{svc: t},
	}
}

type propListInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
}

type propListTool struct {
	svc *PropTools
}

func (f *propListTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "prop_list",
		Desc: "列出项目中的所有道具",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
		}),
	}, nil
}

func (f *propListTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	logging.Info("=== propListTool.InvokableRun called ===")
	logging.Info(fmt.Sprintf("argumentsInJSON: %s", argumentsInJSON))

	var input propListInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		logging.Error(fmt.Sprintf("propListTool: failed to unmarshal: %v", err))
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	props, err := f.svc.propSvc.GetByProjectID(input.ProjectID)
	if err != nil {
		logging.Error(fmt.Sprintf("propListTool: failed to get props: %v", err))
		return "", err
	}

	logging.Info(fmt.Sprintf("propListTool: got %d props", len(props)))
	result, _ := json.Marshal(props)
	return string(result), nil
}

type propSearchInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
	Name      string `json:"name" jsonschema:"required"`
}

type propSearchTool struct {
	svc *PropTools
}

func (f *propSearchTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "prop_search",
		Desc: "在项目中搜索道具名称，返回匹配的道具列表",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"name":       {Type: schema.String, Desc: "道具名称（支持模糊匹配）", Required: true},
		}),
	}, nil
}

func (f *propSearchTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	logging.Info("=== propSearchTool.InvokableRun called ===")
	logging.Info(fmt.Sprintf("argumentsInJSON: %s", argumentsInJSON))

	var input propSearchInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		logging.Error(fmt.Sprintf("propSearchTool: failed to unmarshal: %v", err))
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	props, err := f.svc.propSvc.GetByProjectID(input.ProjectID)
	if err != nil {
		logging.Error(fmt.Sprintf("propSearchTool: failed to get props: %v", err))
		return "", err
	}

	var matched []interface{}
	searchName := strings.ToLower(input.Name)
	for _, p := range props {
		if strings.Contains(strings.ToLower(p.Name), searchName) {
			matched = append(matched, p)
		}
	}

	logging.Info(fmt.Sprintf("propSearchTool: found %d matching props", len(matched)))
	result, _ := json.Marshal(matched)
	return string(result), nil
}

type propGetInput struct {
	ID string `json:"id" jsonschema:"required"`
}

type propGetTool struct {
	svc *PropTools
}

func (f *propGetTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "prop_get",
		Desc: "获取指定道具的详细信息",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"id": {Type: schema.String, Desc: "道具ID", Required: true},
		}),
	}, nil
}

func (f *propGetTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input propGetInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	p, err := f.svc.propSvc.GetByID(input.ID)
	if err != nil {
		if errors.Is(err, prop.ErrNotFound) {
			return "", errors.New("prop not found")
		}
		return "", err
	}

	result, _ := json.Marshal(p)
	return string(result), nil
}

type propCreateInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
	Name      string `json:"name" jsonschema:"required"`
	Desc      string `json:"desc,omitempty"`
	Type      string `json:"type,omitempty"`
}

type propCreateTool struct {
	svc *PropTools
}

func (f *propCreateTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "prop_create",
		Desc: "创建新道具",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"name":       {Type: schema.String, Desc: "道具名称", Required: true},
			"desc":       {Type: schema.String, Desc: "道具描述", Required: false},
			"type":       {Type: schema.String, Desc: "道具类型", Required: false},
		}),
	}, nil
}

func (f *propCreateTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input propCreateInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	created, err := f.svc.propSvc.Create("", input.ProjectID, input.Name, input.Desc, input.Type)
	if err != nil {
		return "", err
	}

	result, _ := json.Marshal(created)
	return string(result), nil
}

type propUpdateInput struct {
	ID   string `json:"id" jsonschema:"required"`
	Name string `json:"name,omitempty"`
	Desc string `json:"desc,omitempty"`
	Type string `json:"type,omitempty"`
}

type propUpdateTool struct {
	svc *PropTools
}

func (f *propUpdateTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "prop_update",
		Desc: "更新道具信息",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"id":   {Type: schema.String, Desc: "道具ID", Required: true},
			"name": {Type: schema.String, Desc: "道具名称", Required: false},
			"desc": {Type: schema.String, Desc: "道具描述", Required: false},
			"type": {Type: schema.String, Desc: "道具类型", Required: false},
		}),
	}, nil
}

func (f *propUpdateTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input propUpdateInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	existing, err := f.svc.propSvc.GetByID(input.ID)
	if err != nil {
		if errors.Is(err, prop.ErrNotFound) {
			return "", errors.New("prop not found")
		}
		return "", err
	}

	updated, err := f.svc.propSvc.Update(input.ID, input.Name, input.Desc, input.Type, existing.Status)
	if err != nil {
		return "", err
	}

	result, _ := json.Marshal(updated)
	return string(result), nil
}

type propDeleteInput struct {
	ID string `json:"id" jsonschema:"required"`
}

type propDeleteTool struct {
	svc *PropTools
}

func (f *propDeleteTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "prop_delete",
		Desc: "删除指定道具",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"id": {Type: schema.String, Desc: "道具ID", Required: true},
		}),
	}, nil
}

func (f *propDeleteTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input propDeleteInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	if err := f.svc.propSvc.Delete(input.ID); err != nil {
		if errors.Is(err, prop.ErrNotFound) {
			return "", errors.New("prop not found")
		}
		return "", err
	}

	return `{"deleted": true}`, nil
}
