package model

import (
	"encoding/json"
	"fmt"

	"github.com/cloudwego/eino/schema"
)

type ToolDefinition struct {
	Type     string             `json:"type"`
	Function FunctionDefinition `json:"function"`
}

type FunctionDefinition struct {
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Parameters  *json.RawMessage `json:"parameters,omitempty"`
}

func ConvertEinoToolsToOpenAI(tools []*schema.ToolInfo) ([]ToolDefinition, error) {
	result := make([]ToolDefinition, 0, len(tools))

	for _, tool := range tools {
		if tool == nil {
			continue
		}

		paramsJSON, err := convertParamsToJSONSchema(tool.ParamsOneOf)
		if err != nil {
			return nil, fmt.Errorf("failed to convert params for tool %s: %w", tool.Name, err)
		}

		result = append(result, ToolDefinition{
			Type: "function",
			Function: FunctionDefinition{
				Name:        tool.Name,
				Description: tool.Desc,
				Parameters:  paramsJSON,
			},
		})
	}

	return result, nil
}

func convertParamsToJSONSchema(paramsOneOf *schema.ParamsOneOf) (*json.RawMessage, error) {
	if paramsOneOf == nil {
		emptySchema := json.RawMessage(`{"type":"object","properties":{}}`)
		return &emptySchema, nil
	}

	jsonSchema, err := paramsOneOf.ToJSONSchema()
	if err != nil {
		return nil, fmt.Errorf("failed to convert params to JSON schema: %w", err)
	}

	if jsonSchema == nil {
		emptySchema := json.RawMessage(`{"type":"object","properties":{}}`)
		return &emptySchema, nil
	}

	jsonBytes, err := json.Marshal(jsonSchema)
	if err != nil {
		return nil, err
	}

	rawMsg := json.RawMessage(jsonBytes)
	return &rawMsg, nil
}

type ToolCall struct {
	Index    int    `json:"index"`
	ID       string `json:"id"`
	Type     string `json:"type"`
	Function struct {
		Name      string `json:"name"`
		Arguments string `json:"arguments"`
	} `json:"function"`
}

func ConvertOpenAIToolCallsToEino(toolCalls []ToolCall) []schema.ToolCall {
	result := make([]schema.ToolCall, 0, len(toolCalls))

	for _, tc := range toolCalls {
		idx := tc.Index
		result = append(result, schema.ToolCall{
			Index: &idx,
			ID:    tc.ID,
			Function: schema.FunctionCall{
				Name:      tc.Function.Name,
				Arguments: tc.Function.Arguments,
			},
		})
	}

	return result
}
