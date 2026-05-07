package config

import (
	"errors"
	"fmt"
	"os"

	"gopkg.in/yaml.v3"

	"open-film-service/internal/pkg/validator"
)

type Config struct {
	ServerAddr      string       `yaml:"server_addr"`
	DB              DBConfig     `yaml:"db"`
	LangModels      ModelsConfig `yaml:"lang_models"`
	TextModels      ModelsConfig `yaml:"text_models"`
	ImageModels     ModelsConfig `yaml:"image_models"`
	VideoModels     ModelsConfig `yaml:"video_models"`
	ShowErrorDetail bool         `yaml:"show_error_detail"`
	MasterAgentPath string       `yaml:"master_agent_path"`
}

type VideoGenConfig struct {
	VeoBaseURL   string `yaml:"veo_base_url"`
	VeoAPIKey    string `yaml:"veo_api_key"`
	ArkAPIKey    string `yaml:"ark_api_key"`
	ArkModel     string `yaml:"ark_model"`
	ComfyBaseURL string `yaml:"comfy_base_url"`
}

type DBConfig struct {
	DSN string `yaml:"dsn"`
}

type ModelsConfig struct {
	Providers map[string]*ProviderConfig `yaml:"providers"`
	Default   string                     `yaml:"default"`
}

type ProviderConfig struct {
	Id         string                  `yaml:"id"`
	Title      string                  `yaml:"title"`
	APIKey     string                  `yaml:"api_key"`
	APIVersion string                  `yaml:"api_version"`
	BaseURL    string                  `yaml:"base_url"`
	DriverType string                  `yaml:"driver_type"`
	Models     map[string]*ModelConfig `yaml:"models"`
}

type DriverType string

const (
	DriverTypeJimengWeb  = "jimeng_web"
	DriverTypeOpenAI     = "openai"
	DriverTypeVolcengine = "volcengine"
)

type ModelConfig struct {
	Id               string   `yaml:"id"`
	Name             string   `yaml:"name"`
	Title            string   `yaml:"title"`
	HttpProxy        string   `yaml:"http_proxy"`
	Provider         string   ``
	ProviderTitle    string   ``
	APIKey           string   `yaml:"api_key"`
	APIVersion       string   `yaml:"api_version"`
	DriverType       string   `yaml:"driver_type"`
	BaseURL          string   `yaml:"base_url"`
	Input            []string `yaml:"input"`
	Output           []string `yaml:"output"`
	Timeout          string   `yaml:"timeout"`
	Temperature      *float32 `yaml:"temperature"`
	MaxTokens        *int     `yaml:"max_tokens"`
	TopP             *float32 `yaml:"top_p"`
	FrequencyPenalty *float32 `yaml:"frequency_penalty"`
	PresencePenalty  *float32 `yaml:"presence_penalty"`
	Thinking         bool     `yaml:"thinking"`
	UseFunctions     bool     `yaml:"use_functions"`
}

type InputType string

const (
	InputTypeText  InputType = "text"
	InputTypeImage InputType = "image"
	InputTypeVideo InputType = "video"
	InputTypeTTS   InputType = "tts"
)

var ErrMissingAPIKey = errors.New("API key is required for provider")

func Load() (*Config, error) {
	configPath := "configs/config.yaml"

	cfg := &Config{}

	data, err := os.ReadFile(configPath)
	if err == nil {
		if err := yaml.Unmarshal(data, cfg); err != nil {
			panic(err)
		}
	} else {
		panic(err)
	}

	if err := cfg.validate(&cfg.TextModels); err != nil {
		return nil, err
	}
	if err := cfg.validate(&cfg.LangModels); err != nil {
		return nil, err
	}
	if err := cfg.validate(&cfg.ImageModels); err != nil {
		return nil, err
	}
	if err := cfg.validate(&cfg.VideoModels); err != nil {
		return nil, err
	}
	validator.SetShowErrorDetail(cfg.ShowErrorDetail)

	return cfg, nil
}

func (c *Config) validate(cfg *ModelsConfig) error {
	for pid, provider := range cfg.Providers {
		provider.Id = pid
		if provider.DriverType == "" {
			return fmt.Errorf("driver_type is required  for %s", pid)
		}
		if provider.APIKey == "" {
			return fmt.Errorf("%w: %s", ErrMissingAPIKey, pid)
		}
		if provider.BaseURL == "" {
			return fmt.Errorf("base_url is required for %s ", pid)
		}
		if err := c.initModels(pid, provider, provider.Models); err != nil {
			return err
		}
	}
	return nil
}

func (c *Config) initModels(pid string, provider *ProviderConfig, models map[string]*ModelConfig) error {
	for mid, model := range models {
		model.Id = mid
		model.Provider = pid
		model.ProviderTitle = provider.Title
		model.BaseURL = provider.BaseURL
		model.APIKey = provider.APIKey
		model.DriverType = provider.DriverType
		if model.Id == "" {
			return fmt.Errorf("id is required  for %s.%s ", pid, mid)
		}
		if model.DriverType == "" {
			return fmt.Errorf("driver_type is required  for %s.%s ", pid, mid)
		}
		if model.Title == "" {
			return fmt.Errorf("title is required  for %s.%s ", pid, mid)
		}
		if model.Title == "" {
			model.Title = model.Id
		}
	}
	return nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func (c *Config) GetLangModelProvider(name string) *ProviderConfig {
	return c.LangModels.Providers[name]
}

func (c *Config) String() string {
	data, err := yaml.Marshal(c)
	if err != nil {
		return fmt.Sprintf("{ServerAddr: %s, DB: {DSN: %s}, Models: {Providers: %d, Default: %s}}",
			c.ServerAddr, c.DB.DSN, len(c.LangModels.Providers), c.LangModels.Default)
	}
	return string(data)
}

func (c *ModelsConfig) GetProvider(name string) (*ProviderConfig, bool) {
	p, ok := c.Providers[name]
	return p, ok
}

func (c *ModelsConfig) GetModel(provider, model string) (*ModelConfig, bool) {
	p, ok := c.Providers[provider]
	if ok {
		m, ok := p.Models[model]
		return m, ok
	}
	return nil, false
}

func (c *ProviderConfig) GetModel(modelName string) (*ModelConfig, error) {
	for _, cnf := range c.Models {
		if cnf.Name == modelName {
			return cnf, nil
		}
	}
	return nil, errors.New(fmt.Sprintf("model not found %s", modelName))
}
