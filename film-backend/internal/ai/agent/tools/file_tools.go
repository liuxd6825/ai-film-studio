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
	"open-film-service/internal/model"
	"open-film-service/internal/service/file"
)

var (
	ErrNotFound = errors.New("not found")
)

type FileTools struct {
	fileSvc *file.Service
}

func NewFileTools(fileSvc *file.Service) *FileTools {
	return &FileTools{
		fileSvc: fileSvc,
	}
}

func (t *FileTools) Tools() []tool.BaseTool {
	return []tool.BaseTool{
		&fileListTool{svc: t},
		&fileFindTool{svc: t},
		&fileReadTool{svc: t},
		&fileCreateTool{svc: t},
		&fileUpdateTool{svc: t},
		&fileDeleteTool{svc: t},
	}
}

type fileListInput struct {
	ProjectID string  `json:"project_id" jsonschema:"required"`
	FolderID  *string `json:"folder_id,omitempty"`
}

type fileListTool struct {
	svc *FileTools
}

func (f *fileListTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "file_list",
		Desc: "列出项目中的文件列表，支持按文件夹过滤",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"folder_id":  {Type: schema.String, Desc: "文件夹ID，可选，空表示根目录", Required: false},
		}),
	}, nil
}

func (f *fileListTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	logging.Info("=== fileListTool.InvokableRun called ===")
	logging.Info(fmt.Sprintf("argumentsInJSON: %s", argumentsInJSON))

	var input fileListInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		logging.Error(fmt.Sprintf("fileListTool: failed to unmarshal: %v", err))
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	logging.Info(fmt.Sprintf("fileListTool: projectID=%s, folderID=%v", input.ProjectID, input.FolderID))

	files, err := f.svc.fileSvc.GetByProjectID(input.ProjectID, input.FolderID, false)
	if err != nil {
		logging.Error(fmt.Sprintf("fileListTool: failed to get files: %v", err))
		return "", err
	}

	logging.Info(fmt.Sprintf("fileListTool: got %d files", len(files)))

	result, _ := json.Marshal(files)
	return string(result), nil
}

type fileFindInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
	Filename  string `json:"filename" jsonschema:"required"`
}

type fileFindTool struct {
	svc *FileTools
}

func (f *fileFindTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "file_find",
		Desc: "在项目中搜索文件名，返回匹配的文件列表",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"filename":   {Type: schema.String, Desc: "文件名（支持模糊匹配）", Required: true},
		}),
	}, nil
}

func (f *fileFindTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	logging.Info("=== fileFindTool.InvokableRun called ===")
	logging.Info(fmt.Sprintf("argumentsInJSON: %s", argumentsInJSON))

	var input fileFindInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		logging.Error(fmt.Sprintf("fileFindTool: failed to unmarshal: %v", err))
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	files, err := f.svc.fileSvc.GetByProjectID(input.ProjectID, nil, true)
	if err != nil {
		logging.Error(fmt.Sprintf("fileFindTool: failed to get files: %v", err))
		return "", err
	}

	var matched []model.File
	searchName := strings.ToLower(input.Filename)
	for _, file := range files {
		if strings.Contains(strings.ToLower(file.Name), searchName) {
			matched = append(matched, file)
		}
	}

	logging.Info(fmt.Sprintf("fileFindTool: found %d matching files", len(matched)))
	result, _ := json.Marshal(matched)
	return string(result), nil
}

type fileReadInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
	FileID    string `json:"file_id" jsonschema:"required"`
}

type fileReadTool struct {
	svc *FileTools
}

func (f *fileReadTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "file_read",
		Desc: "读取指定文件的内容",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"file_id":    {Type: schema.String, Desc: "文件ID", Required: true},
		}),
	}, nil
}

func (f *fileReadTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input fileReadInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	fileResult, err := f.svc.fileSvc.GetByID(input.FileID)
	if err != nil {
		if errors.Is(err, file.ErrNotFound) {
			return "", ErrNotFound
		}
		return "", err
	}

	return fileResult.Content, nil
}

type fileCreateInput struct {
	ProjectID string  `json:"project_id" jsonschema:"required"`
	Name      string  `json:"name" jsonschema:"required"`
	FolderID  *string `json:"folder_id,omitempty"`
	IsDir     bool    `json:"is_dir"`
	Content   string  `json:"content,omitempty"`
}

type fileCreateTool struct {
	svc *FileTools
}

func (f *fileCreateTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "file_create",
		Desc: "创建新文件或文件夹",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"name":       {Type: schema.String, Desc: "文件名", Required: true},
			"folder_id":  {Type: schema.String, Desc: "所属文件夹ID，可选", Required: false},
			"is_dir":     {Type: schema.Boolean, Desc: "是否为文件夹", Required: false},
			"content":    {Type: schema.String, Desc: "文件内容，可选", Required: false},
		}),
	}, nil
}

func (f *fileCreateTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input fileCreateInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	created, err := f.svc.fileSvc.Create(input.ProjectID, input.Name, input.FolderID, input.IsDir, input.Content)
	if err != nil {
		return "", err
	}

	result, _ := json.Marshal(created)
	return string(result), nil
}

type fileUpdateInput struct {
	ProjectID string  `json:"project_id" jsonschema:"required"`
	FileID    string  `json:"file_id" jsonschema:"required"`
	Name      string  `json:"name,omitempty"`
	FolderID  *string `json:"folder_id,omitempty"`
	Content   string  `json:"content,omitempty"`
}

type fileUpdateTool struct {
	svc *FileTools
}

func (f *fileUpdateTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "file_update",
		Desc: "更新文件内容或移动文件到其他文件夹",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"file_id":    {Type: schema.String, Desc: "文件ID", Required: true},
			"name":       {Type: schema.String, Desc: "新文件名，可选", Required: false},
			"folder_id":  {Type: schema.String, Desc: "目标文件夹ID，可选", Required: false},
			"content":    {Type: schema.String, Desc: "新内容，可选", Required: false},
		}),
	}, nil
}

func (f *fileUpdateTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input fileUpdateInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	updated, err := f.svc.fileSvc.Update(input.FileID, input.Name, input.FolderID, input.Content)
	if err != nil {
		if errors.Is(err, file.ErrNotFound) {
			return "", ErrNotFound
		}
		return "", err
	}

	result, _ := json.Marshal(updated)
	return string(result), nil
}

type fileDeleteInput struct {
	ProjectID string `json:"project_id" jsonschema:"required"`
	FileID    string `json:"file_id" jsonschema:"required"`
}

type fileDeleteTool struct {
	svc *FileTools
}

func (f *fileDeleteTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "file_delete",
		Desc: "删除指定文件",
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"project_id": {Type: schema.String, Desc: "项目ID", Required: true},
			"file_id":    {Type: schema.String, Desc: "文件ID", Required: true},
		}),
	}, nil
}

func (f *fileDeleteTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var input fileDeleteInput
	if err := json.Unmarshal([]byte(argumentsInJSON), &input); err != nil {
		return "", fmt.Errorf("invalid arguments: %w", err)
	}

	if err := f.svc.fileSvc.Delete(input.FileID); err != nil {
		if errors.Is(err, file.ErrNotFound) {
			return "", ErrNotFound
		}
		return "", err
	}

	return `{"deleted": true}`, nil
}
