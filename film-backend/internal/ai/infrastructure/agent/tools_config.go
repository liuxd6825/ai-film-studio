package agent

import (
	"open-film-service/internal/ai/infrastructure/agent/tools"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
)

type ToolsConfig struct {
	FileTools   *tools.FileTools
	FolderTools *tools.FolderTools
}

func (c *ToolsConfig) Tools() []tool.BaseTool {
	var result []tool.BaseTool
	if c.FileTools != nil {
		result = append(result, c.FileTools.Tools()...)
	}
	if c.FolderTools != nil {
		result = append(result, c.FolderTools.Tools()...)
	}
	return result
}

func BuildToolsNodeConfig(toolsConfig *ToolsConfig) *compose.ToolsNodeConfig {
	if toolsConfig == nil {
		return nil
	}

	toolBases := toolsConfig.Tools()
	if len(toolBases) == 0 {
		return nil
	}

	return &compose.ToolsNodeConfig{
		Tools: toolBases,
	}
}
