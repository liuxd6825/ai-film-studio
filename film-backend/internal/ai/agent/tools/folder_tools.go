package tools

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"

	"open-film-service/internal/logging"
	"open-film-service/internal/service/folder"
)

type FolderTools struct {
	folderSvc *folder.Service
}

func NewFolderTools(folderSvc *folder.Service) *FolderTools {
	return &FolderTools{
		folderSvc: folderSvc,
	}
}

func (t *FolderTools) Tools() []tool.BaseTool {
	return []tool.BaseTool{
		&folderListTool{svc: t},
		&folderCreateTool{svc: t},
		&folderUpdateTool{svc: t},
		&folderDeleteTool{svc: t},
	}
}

type folderListInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
}

type folderListTool struct {
	svc *FolderTools
}

func (f *folderListTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "folder_list",
		Desc: "列出项目中的所有文件夹",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
		}),
	}, nil
}

func (f *folderListTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	logging.Info("=== folderListTool.InvokableRun called ===")
	logging.Info(fmt.Sprintf("argumentsInJSON: %s", argumentsInJSON))

	var input folderListInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		logging.Error(fmt.Sprintf("folderListTool: failed to unmarshal: %v", err))
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	folders, err := f.svc.folderSvc.GetByProjectID(input.ProjectID)
	if err != nil {
		logging.Error(fmt.Sprintf("folderListTool: failed to get folders: %v", err))
		return "", err
	}

	logging.Info(fmt.Sprintf("folderListTool: got %d folders", len(folders)))
	result, _ := json.Marshal(folders)
	return string(result), nil
}

type folderCreateInput struct {
	ProjectID string  `json:"project_id" jsonschema:"required"`
	Name      string  `json:"name" jsonschema:"required"`
	ParentID  *string `json:"parent_id,omitempty"`
}

type folderCreateTool struct {
	svc *FolderTools
}

func (f *folderCreateTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "folder_create",
		Desc: "创建新文件夹",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"name":       {Type: schema.String, Desc: "文件夹名", Required: true},
			"parent_id":  {Type: schema.String, Desc: "父文件夹ID，可选", Required: false},
		}),
	}, nil
}

func (f *folderCreateTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input folderCreateInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	created, err := f.svc.folderSvc.Create(input.ProjectID, input.Name, input.ParentID)
	if err != nil {
		return "", err
	}

	result, _ := json.Marshal(created)
	return string(result), nil
}

type folderUpdateInput struct {
	ProjectID string  `json:"project_id" jsonschema:"required"`
	FolderID  string  `json:"folder_id" jsonschema:"required"`
	Name      string  `json:"name,omitempty"`
	ParentID  *string `json:"parent_id,omitempty"`
}

type folderUpdateTool struct {
	svc *FolderTools
}

func (f *folderUpdateTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "folder_update",
		Desc: "更新文件夹名称或移动文件夹",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"folder_id":  {Type: schema.String, Desc: "文件夹ID", Required: true},
			"name":       {Type: schema.String, Desc: "新文件夹名，可选", Required: false},
			"parent_id":  {Type: schema.String, Desc: "目标父文件夹ID，可选", Required: false},
		}),
	}, nil
}

func (f *folderUpdateTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input folderUpdateInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	updated, err := f.svc.folderSvc.Update(input.FolderID, input.Name, input.ParentID)
	if err != nil {
		if errors.Is(err, folder.ErrNotFound) {
			// using ErrNotFound from file_tools, wait I should define it or keep it simple.
			// Let's use custom error or redefine ErrNotFound in folder_tools.
			return "", errors.New("not found")
		}
		return "", err
	}

	result, _ := json.Marshal(updated)
	return string(result), nil
}

type folderDeleteInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
	FolderID  string `json:"folder_id" jsonschema:"required"`
}

type folderDeleteTool struct {
	svc *FolderTools
}

func (f *folderDeleteTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "folder_delete",
		Desc: "删除指定文件夹",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"folder_id":  {Type: schema.String, Desc: "文件夹ID", Required: true},
		}),
	}, nil
}

func (f *folderDeleteTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input folderDeleteInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	if err := f.svc.folderSvc.Delete(input.FolderID); err != nil {
		if errors.Is(err, folder.ErrNotFound) {
			return "", errors.New("not found")
		}
		return "", err
	}

	return `{"deleted": true}`, nil
}
