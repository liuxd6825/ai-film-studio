package video

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"open-film-service/internal/service/comfy"
)

var (
	ErrJobNotFound  = errors.New("job not found")
	ErrInvalidModel = errors.New("invalid model")
)

type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusProcessing JobStatus = "processing"
	JobStatusCompleted  JobStatus = "completed"
	JobStatusFailed     JobStatus = "failed"
)

type GenerationJob struct {
	ID        string
	ProjectID string
	NodeID    string
	Model     string
	Status    JobStatus
	Progress  int
	Result    map[string]interface{}
	Error     string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type JobStore interface {
	Create(job *GenerationJob) error
	Get(id string) (*GenerationJob, error)
	Update(job *GenerationJob) error
	Delete(id string) error
}

type GenerationService struct {
	jobStore   JobStore
	comfySvc   *comfy.ComfyService
	veoClient  *VeoClient
	arkClient  *ArkVideoClient
	veoBaseURL string
	mu         sync.RWMutex
	jobs       map[string]*GenerationJob
}

type GenerationConfig struct {
	ComfyBaseURL string
	VeoBaseURL   string
	VeoAPIKey    string
	ArkAPIKey    string
	ArkModel     string
}

func NewGenerationService(cfg GenerationConfig, jobStore JobStore) *GenerationService {
	svc := &GenerationService{
		jobStore: jobStore,
		mu:       sync.RWMutex{},
		jobs:     make(map[string]*GenerationJob),
	}

	if cfg.ComfyBaseURL != "" {
		svc.comfySvc = comfy.NewComfyService(nil, comfy.NewExecutor(cfg.ComfyBaseURL))
	}

	if cfg.VeoBaseURL != "" && cfg.VeoAPIKey != "" {
		svc.veoClient = NewVeoClient(cfg.VeoBaseURL, cfg.VeoAPIKey)
		svc.veoBaseURL = cfg.VeoBaseURL
	}

	if cfg.ArkAPIKey != "" && cfg.ArkModel != "" {
		svc.arkClient = NewArkVideoClient(cfg.ArkAPIKey, cfg.ArkModel)
	}

	return svc
}

func (s *GenerationService) StartGeneration(projectID, nodeID, model string, extraParams map[string]interface{}) (string, error) {
	jobID := uuid.New().String()

	job := &GenerationJob{
		ID:        jobID,
		ProjectID: projectID,
		NodeID:    nodeID,
		Model:     model,
		Status:    JobStatusPending,
		Result:    extraParams,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.jobStore.Create(job); err != nil {
		return "", err
	}

	s.mu.Lock()
	s.jobs[jobID] = job
	s.mu.Unlock()

	go s.processJob(jobID)

	return jobID, nil
}

func (s *GenerationService) processJob(jobID string) {
	ctx := context.Background()

	s.mu.Lock()
	job := s.jobs[jobID]
	s.mu.Unlock()

	if job == nil {
		job, _ = s.jobStore.Get(jobID)
		if job == nil {
			return
		}
	}

	job.Status = JobStatusProcessing
	job.UpdatedAt = time.Now()
	s.jobStore.Update(job)

	var result map[string]interface{}
	var err error

	switch job.Model {
	case "comfyui":
		result, err = s.runComfyUI(ctx, job)
	case "google-veo", "veo":
		result, err = s.runVeo(ctx, job)
	case "ark":
		result, err = s.runArkVideo(ctx, job)
	default:
		err = ErrInvalidModel
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	if err != nil {
		job.Status = JobStatusFailed
		job.Error = err.Error()
	} else {
		job.Status = JobStatusCompleted
		job.Result = result
	}
	job.UpdatedAt = time.Now()

	s.jobStore.Update(job)
	s.jobs[jobID] = job
}

func (s *GenerationService) runArkVideo(ctx context.Context, job *GenerationJob) (map[string]interface{}, error) {
	if s.arkClient == nil {
		return nil, errors.New("ark client not configured")
	}

	prompt := ""
	if p, ok := job.Result["prompt"].(string); ok {
		prompt = p
	}
	imageURL := ""
	if u, ok := job.Result["imageURL"].(string); ok {
		imageURL = u
	}

	resp, err := s.arkClient.Generate(ctx, prompt, imageURL)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"taskId": resp.ID,
		"status": "pending",
	}, nil
}

func (s *GenerationService) runComfyUI(ctx context.Context, job *GenerationJob) (map[string]interface{}, error) {
	if s.comfySvc == nil {
		return nil, errors.New("comfy service not configured")
	}

	workflowJSON := job.Result["workflow"].(string)
	input := job.Result["input"].(map[string]interface{})

	execResult, err := s.comfySvc.Execute(workflowJSON, input)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"promptId":   execResult.PromptID,
		"status":     execResult.Status,
		"outputUrls": execResult.OutputURLs,
	}, nil
}

func (s *GenerationService) runVeo(ctx context.Context, job *GenerationJob) (map[string]interface{}, error) {
	if s.veoClient == nil {
		return nil, errors.New("veo client not configured")
	}

	prompt := ""
	if p, ok := job.Result["prompt"].(string); ok {
		prompt = p
	}

	req := &GenerateRequest{
		Prompt:        prompt,
		VideoDuration: 8,
		Quality:       "high",
	}

	resp, err := s.veoClient.Generate(ctx, req)
	if err != nil {
		return nil, err
	}

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(2 * time.Second):
			status, err := s.veoClient.GetOperationStatus(ctx, resp.OperationName)
			if err != nil {
				return nil, err
			}

			if status.Done {
				if status.Error != nil {
					return nil, errors.New(status.Error.Message)
				}

				videoURL := ""
				if meta, ok := status.Meta["generatedVideos"].([]interface{}); ok && len(meta) > 0 {
					if v, ok := meta[0].(map[string]interface{}); ok {
						videoURL, _ = v["videoUrl"].(string)
					}
				}

				return map[string]interface{}{
					"videoUrl": videoURL,
					"status":   "completed",
				}, nil
			}

			job.Progress += 10
			if job.Progress > 90 {
				job.Progress = 90
			}
			s.jobStore.Update(job)
		}
	}
}

func (s *GenerationService) GetJobStatus(jobID string) (map[string]interface{}, error) {
	s.mu.RLock()
	job := s.jobs[jobID]
	s.mu.RUnlock()

	if job == nil {
		job, err := s.jobStore.Get(jobID)
		if err != nil {
			return nil, ErrJobNotFound
		}
		return map[string]interface{}{
			"jobId":    job.ID,
			"status":   job.Status,
			"progress": job.Progress,
			"result":   job.Result,
			"error":    job.Error,
		}, nil
	}

	return map[string]interface{}{
		"jobId":    job.ID,
		"status":   job.Status,
		"progress": job.Progress,
		"result":   job.Result,
		"error":    job.Error,
	}, nil
}

type InMemoryJobStore struct {
	jobs map[string]*GenerationJob
	mu   sync.RWMutex
}

func NewInMemoryJobStore() *InMemoryJobStore {
	return &InMemoryJobStore{
		jobs: make(map[string]*GenerationJob),
	}
}

func (s *InMemoryJobStore) Create(job *GenerationJob) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs[job.ID] = job
	return nil
}

func (s *InMemoryJobStore) Get(id string) (*GenerationJob, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if job, ok := s.jobs[id]; ok {
		return job, nil
	}
	return nil, ErrJobNotFound
}

func (s *InMemoryJobStore) Update(job *GenerationJob) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs[job.ID] = job
	return nil
}

func (s *InMemoryJobStore) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.jobs, id)
	return nil
}
