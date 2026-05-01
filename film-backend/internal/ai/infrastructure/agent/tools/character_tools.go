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
	"open-film-service/internal/service/character"
)

type CharacterTools struct {
	charSvc *character.Service
}

func NewCharacterTools(charSvc *character.Service) *CharacterTools {
	return &CharacterTools{
		charSvc: charSvc,
	}
}

func (t *CharacterTools) Tools() []tool.BaseTool {
	return []tool.BaseTool{
		&characterListTool{svc: t},
		&characterSearchTool{svc: t},
		&characterGetTool{svc: t},
		&characterCreateTool{svc: t},
		&characterUpdateTool{svc: t},
		&characterDeleteTool{svc: t},
	}
}

type characterListInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
}

type characterListTool struct {
	svc *CharacterTools
}

func (f *characterListTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "character_list",
		Desc: "列出项目中的所有角色",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
		}),
	}, nil
}

func (f *characterListTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	logging.Info("=== characterListTool.InvokableRun called ===")
	logging.Info(fmt.Sprintf("argumentsInJSON: %s", argumentsInJSON))

	var input characterListInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		logging.Error(fmt.Sprintf("characterListTool: failed to unmarshal: %v", err))
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	characters, err := f.svc.charSvc.GetByProjectID(input.ProjectID)
	if err != nil {
		logging.Error(fmt.Sprintf("characterListTool: failed to get characters: %v", err))
		return "", err
	}

	logging.Info(fmt.Sprintf("characterListTool: got %d characters", len(characters)))
	result, _ := json.Marshal(characters)
	return string(result), nil
}

type characterSearchInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
	Name      string `json:"name" jsonschema:"required"`
}

type characterSearchTool struct {
	svc *CharacterTools
}

func (f *characterSearchTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "character_search",
		Desc: "在项目中搜索角色名称，返回匹配的角色列表",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"name":       {Type: schema.String, Desc: "角色名称（支持模糊匹配）", Required: true},
		}),
	}, nil
}

func (f *characterSearchTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	logging.Info("=== characterSearchTool.InvokableRun called ===")
	logging.Info(fmt.Sprintf("argumentsInJSON: %s", argumentsInJSON))

	var input characterSearchInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		logging.Error(fmt.Sprintf("characterSearchTool: failed to unmarshal: %v", err))
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	characters, err := f.svc.charSvc.GetByProjectID(input.ProjectID)
	if err != nil {
		logging.Error(fmt.Sprintf("characterSearchTool: failed to get characters: %v", err))
		return "", err
	}

	var matched []interface{}
	searchName := strings.ToLower(input.Name)
	for _, c := range characters {
		if strings.Contains(strings.ToLower(c.Name), searchName) {
			matched = append(matched, c)
		}
	}

	logging.Info(fmt.Sprintf("characterSearchTool: found %d matching characters", len(matched)))
	result, _ := json.Marshal(matched)
	return string(result), nil
}

type characterGetInput struct {
	ID string `json:"id" jsonschema:"required"`
}

type characterGetTool struct {
	svc *CharacterTools
}

func (f *characterGetTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "character_get",
		Desc: "获取指定角色的详细信息",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"id": {Type: schema.String, Desc: "角色ID", Required: true},
		}),
	}, nil
}

func (f *characterGetTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input characterGetInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	char, err := f.svc.charSvc.GetByID(input.ID)
	if err != nil {
		if errors.Is(err, character.ErrNotFound) {
			return "", errors.New("character not found")
		}
		return "", err
	}

	result, _ := json.Marshal(char)
	return string(result), nil
}

type characterCreateInput struct {
	ProjectID   string `json:"project_id" jsonschema:"required"`
	Name        string `json:"name" jsonschema:"required"`
	Desc        string `json:"desc,omitempty"`
	Type        string `json:"type,omitempty"`
	Appearance  string `json:"appearance,omitempty"`
	Personality string `json:"personality,omitempty"`
	Background  string `json:"background,omitempty"`
	Abilities   string `json:"abilities,omitempty"`
	Faction     string `json:"faction,omitempty"`
}

type characterCreateTool struct {
	svc *CharacterTools
}

func (f *characterCreateTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "character_create",
		Desc: "创建新角色",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id":  {Type: schema.String, Desc: "项目ID", Required: true},
			"name":        {Type: schema.String, Desc: "角色名称", Required: true},
			"desc":        {Type: schema.String, Desc: "角色描述", Required: false},
			"type":        {Type: schema.String, Desc: "角色类型（主演/配角等）", Required: false},
			"appearance":  {Type: schema.String, Desc: "外貌特征", Required: false},
			"personality": {Type: schema.String, Desc: "性格特点", Required: false},
			"background":  {Type: schema.String, Desc: "背景故事", Required: false},
			"abilities":   {Type: schema.String, Desc: "能力技能", Required: false},
			"faction":     {Type: schema.String, Desc: "所属阵营", Required: false},
		}),
	}, nil
}

func (f *characterCreateTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input characterCreateInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	created, err := f.svc.charSvc.Create(
		"", input.ProjectID, input.Name, input.Desc, input.Type,
		input.Appearance, input.Personality, input.Background, input.Abilities, input.Faction,
	)
	if err != nil {
		return "", err
	}

	result, _ := json.Marshal(created)
	return string(result), nil
}

type characterUpdateInput struct {
	ID          string `json:"id" jsonschema:"required"`
	Name        string `json:"name,omitempty"`
	Desc        string `json:"desc,omitempty"`
	Type        string `json:"type,omitempty"`
	Appearance  string `json:"appearance,omitempty"`
	Personality string `json:"personality,omitempty"`
	Background  string `json:"background,omitempty"`
	Abilities   string `json:"abilities,omitempty"`
	Faction     string `json:"faction,omitempty"`
}

type characterUpdateTool struct {
	svc *CharacterTools
}

func (f *characterUpdateTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "character_update",
		Desc: "更新角色信息",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"id":          {Type: schema.String, Desc: "角色ID", Required: true},
			"name":        {Type: schema.String, Desc: "角色名称", Required: false},
			"desc":        {Type: schema.String, Desc: "角色描述", Required: false},
			"type":        {Type: schema.String, Desc: "角色类型", Required: false},
			"appearance":  {Type: schema.String, Desc: "外貌特征", Required: false},
			"personality": {Type: schema.String, Desc: "性格特点", Required: false},
			"background":  {Type: schema.String, Desc: "背景故事", Required: false},
			"abilities":   {Type: schema.String, Desc: "能力技能", Required: false},
			"faction":     {Type: schema.String, Desc: "所属阵营", Required: false},
		}),
	}, nil
}

func (f *characterUpdateTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input characterUpdateInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	existing, err := f.svc.charSvc.GetByID(input.ID)
	if err != nil {
		if errors.Is(err, character.ErrNotFound) {
			return "", errors.New("character not found")
		}
		return "", err
	}

	updated, err := f.svc.charSvc.Update(
		input.ID, input.Name, input.Desc, input.Type, existing.Status,
		input.Appearance, input.Personality, input.Background, input.Abilities, input.Faction,
	)
	if err != nil {
		return "", err
	}

	result, _ := json.Marshal(updated)
	return string(result), nil
}

type characterDeleteInput struct {
	ID string `json:"id" jsonschema:"required"`
}

type characterDeleteTool struct {
	svc *CharacterTools
}

func (f *characterDeleteTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "character_delete",
		Desc: "删除指定角色",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"id": {Type: schema.String, Desc: "角色ID", Required: true},
		}),
	}, nil
}

func (f *characterDeleteTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input characterDeleteInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	if err := f.svc.charSvc.Delete(input.ID); err != nil {
		if errors.Is(err, character.ErrNotFound) {
			return "", errors.New("character not found")
		}
		return "", err
	}

	return `{"deleted": true}`, nil
}
