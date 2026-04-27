package comfy

import (
	"context"
	"fmt"
)

type WorkflowBuilder struct {
	modelAdapter ModelAdapter
}

type ModelAdapter interface {
	Generate(ctx context.Context, messages []*Message) (string, error)
}

type Message struct {
	Role    string
	Content string
}

func NewWorkflowBuilder(modelAdapter ModelAdapter) *WorkflowBuilder {
	return &WorkflowBuilder{modelAdapter: modelAdapter}
}

func (b *WorkflowBuilder) BuildFromDescription(ctx context.Context, description string) (string, error) {
	prompt := fmt.Sprintf(`Generate a ComfyUI workflow JSON for: %s

Return only the JSON workflow definition.`, description)

	messages := []*Message{
		{Role: "user", Content: prompt},
	}

	workflowJSON, err := b.modelAdapter.Generate(ctx, messages)
	if err != nil {
		return "", err
	}

	return workflowJSON, nil
}
