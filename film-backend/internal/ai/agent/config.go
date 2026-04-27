package agent

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

type AgentConfig struct {
	Id           string   `yaml:"id"`
	Name         string   `yaml:"name"`
	Description  string   `yaml:"description"`
	Provider     string   `yaml:"provider"`
	Model        string   `yaml:"model"`
	Instructions string   `yaml:"instructions"`
	Skills       []string `yaml:"skills"`
}

func (c *AgentConfig) MemoryPath(agentsDir string) string {
	return filepath.Join(agentsDir, c.Name, "memory.md")
}

func (c *AgentConfig) ValidateSkills(agentsDir, skillsDir string) error {
	for _, skillName := range c.Skills {
		var skillPath string
		if strings.HasPrefix(skillName, "system:") {
			skillPath = filepath.Join(skillsDir, skillName[7:], "SKILL.md")
		} else {
			skillPath = filepath.Join(agentsDir, c.Name, "skills", skillName, "SKILL.md")
		}
		if _, err := os.Stat(skillPath); os.IsNotExist(err) {
			return fmt.Errorf("skill not found: %s at %s", skillName, skillPath)
		}
	}
	return nil
}

type MasterConfig struct {
	DefaultAgent string `yaml:"defaultAgent"`
}

func LoadMasterConfig(path string) (*MasterConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read master config: %w", err)
	}

	var cfg MasterConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse master config: %w", err)
	}

	return &cfg, nil
}

func LoadAgentConfigs(dir string) ([]*AgentConfig, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("failed to read agents dir: %w", err)
	}

	var configs []*AgentConfig
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		if entry.Name() == "master" {
			continue
		}

		agentDir := filepath.Join(dir, entry.Name())
		configPath := filepath.Join(agentDir, "agent.yaml")

		data, err := os.ReadFile(configPath)
		if err != nil {
			return nil, fmt.Errorf("failed to read agent config %s: %w", configPath, err)
		}

		var cfg AgentConfig
		if err := yaml.Unmarshal(data, &cfg); err != nil {
			return nil, fmt.Errorf("failed to parse agent config %s: %w", configPath, err)
		}

		configs = append(configs, &cfg)
	}

	return configs, nil
}

func GetAgentConfigByName(configs []*AgentConfig, name string) *AgentConfig {
	for _, cfg := range configs {
		if cfg.Name == name {
			return cfg
		}
	}
	return nil
}
