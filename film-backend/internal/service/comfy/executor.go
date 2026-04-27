package comfy

import (
	"context"
	"time"
)

type Executor struct {
	client *Client
}

func NewExecutor(baseURL string) *Executor {
	return &Executor{
		client: NewClient(baseURL),
	}
}

type ExecutionResult struct {
	PromptID   string
	Status     string
	OutputURLs []string
	Error      error
}

func (e *Executor) Execute(ctx context.Context, workflowJSON string, input map[string]interface{}) (*ExecutionResult, error) {
	execResp, err := e.client.ExecuteWorkflow(workflowJSON, input)
	if err != nil {
		return nil, err
	}

	result := &ExecutionResult{
		PromptID: execResp.PromptID,
	}

	timer := time.NewTimer(2 * time.Second)
	defer timer.Stop()
	for {
		select {
		case <-ctx.Done():
			result.Status = "failed"
			result.Error = ctx.Err()
			return result, nil
		case <-timer.C:
			timer.Reset(2 * time.Second)
			history, err := e.client.GetHistory(execResp.PromptID)
			if err != nil {
				result.Status = "failed"
				result.Error = err
				return result, nil
			}

			if history.Status.Status == "success" {
				result.Status = "completed"
				for _, output := range history.Outputs {
					if m, ok := output.(map[string]interface{}); ok {
						if images, ok := m["images"].([]interface{}); ok {
							for _, img := range images {
								if imgPath, ok := img.(map[string]interface{}); ok {
									if filename, ok := imgPath["filename"].(string); ok {
										result.OutputURLs = append(result.OutputURLs, e.client.baseURL+"/view?filename="+filename)
									}
								}
							}
						}
					}
				}
				return result, nil
			} else if history.Status.Status == "failed" {
				result.Status = "failed"
				return result, nil
			}
		}
	}
}
