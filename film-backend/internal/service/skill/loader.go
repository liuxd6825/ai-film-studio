package skill

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var (
	ErrInvalidFormat = errors.New("invalid skill format")
)

type SkillParameterDef struct {
	Name        string
	Type        string
	Description string
	Required    bool
	Default     string
}

type SkillDefinition struct {
	Name         string
	Description  string
	Type         string
	Category     string
	SkillName    string
	Instructions string
	Parameters   map[string]SkillParameterDef
	SourceFile   string
	SkillDir     string
	Scripts      map[string]string
	Examples     map[string]string
	Assets       map[string]string
	References   map[string]string
}

type Loader struct {
	configsDir string
	skills     map[string]*SkillDefinition
}

func NewLoader(configsDir string) *Loader {
	return &Loader{
		configsDir: configsDir,
		skills:     make(map[string]*SkillDefinition),
	}
}

func (l *Loader) GetSystemSkillsDir() string {
	return l.configsDir + "/skills"
}

func (l *Loader) GetAgentSkillsDir(agentId string) string {
	return l.configsDir + fmt.Sprintf("/agents/%s/skills", agentId)
}

func (l *Loader) LoadAll() error {
	skillsDir := l.GetSystemSkillsDir()
	if skillsDir == "" {
		return nil
	}

	categoryEntries, err := os.ReadDir(skillsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	for _, categoryEntry := range categoryEntries {
		if !categoryEntry.IsDir() {
			continue
		}

		categoryName := categoryEntry.Name()
		skillDir := filepath.Join(skillsDir, categoryName)

		skillEntries, err := os.ReadDir(skillDir)
		if err != nil {
			continue
		}

		for _, skillEntry := range skillEntries {
			if !skillEntry.IsDir() {
				continue
			}

			skillName := skillEntry.Name()
			skillDir := filepath.Join(skillDir, skillName)
			skillPath := filepath.Join(skillDir, "SKILL.md")

			skill, err := l.LoadFile(skillPath)
			if err != nil {
				continue
			}

			skill.Category = categoryName
			skill.SkillName = skillName
			skill.Name = categoryName + "/" + skillName
			skill.SkillDir = skillDir

			l.loadSkillResources(skill)
			l.skills[skill.Name] = skill
		}
	}

	return nil
}

func (l *Loader) LoadFile(filePath string) (*SkillDefinition, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	skill, err := ParseSkillMarkdown(string(content), filePath)
	if err != nil {
		return nil, err
	}

	return skill, nil
}

func ParseSkillMarkdown(content, sourceFile string) (*SkillDefinition, error) {
	skill := &SkillDefinition{
		Parameters: make(map[string]SkillParameterDef),
		SourceFile: sourceFile,
	}

	lines := strings.Split(content, "\n")
	inFrontMatter := false
	inParams := false
	inInstructions := false
	var frontMatter strings.Builder
	var instructionsBuilder strings.Builder

	var rawName, rawDesc, rawType string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if strings.HasPrefix(trimmed, "---") {
			if !inFrontMatter {
				inFrontMatter = true
				continue
			} else {
				inFrontMatter = false
				var fm map[string]interface{}
				if err := json.Unmarshal([]byte(frontMatter.String()), &fm); err == nil {
					if v, ok := fm["name"].(string); ok {
						rawName = v
					}
					if v, ok := fm["description"].(string); ok {
						rawDesc = v
					}
					if v, ok := fm["type"].(string); ok {
						rawType = v
					}
				}
				if rawName != "" {
					skill.Name = rawName
					skill.Description = rawDesc
					skill.Type = rawType
				}
				continue
			}
		}

		if inFrontMatter {
			frontMatter.WriteString(line)
			frontMatter.WriteString("\n")
			continue
		}

		if strings.HasPrefix(trimmed, "## ") {
			section := strings.TrimPrefix(trimmed, "## ")
			lowerSection := strings.ToLower(section)

			if strings.HasPrefix(lowerSection, "param") {
				inParams = true
				inInstructions = false
			} else if strings.HasPrefix(lowerSection, "instruction") {
				inInstructions = true
				inParams = false
			} else {
				inParams = false
				inInstructions = false
			}
			continue
		}

		if strings.HasPrefix(trimmed, "# ") && skill.Name == "" {
			skill.Name = strings.TrimPrefix(trimmed, "# ")
			continue
		}

		if strings.HasPrefix(trimmed, "**Description:**") && skill.Description == "" {
			skill.Description = strings.TrimPrefix(trimmed, "**Description:**")
			skill.Description = strings.TrimSpace(skill.Description)
			continue
		}

		if inInstructions {
			instructionsBuilder.WriteString(line)
			instructionsBuilder.WriteString("\n")
		}

		if inParams && strings.HasPrefix(trimmed, "- ") {
			param := parseParameterLine(trimmed)
			if param.Name != "" {
				skill.Parameters[param.Name] = param
			}
		}
	}

	skill.Instructions = strings.TrimSpace(instructionsBuilder.String())

	if skill.Name == "" {
		return nil, ErrInvalidFormat
	}

	return skill, nil
}

func parseParameterLine(line string) SkillParameterDef {
	param := SkillParameterDef{Required: true}

	pattern := regexp.MustCompile(`[-\*]\s*(\w+)(?::\s*(.*))?`)
	matches := pattern.FindStringSubmatch(line)
	if len(matches) < 2 {
		return param
	}

	param.Name = matches[1]
	if len(matches) > 2 {
		desc := matches[2]
		if strings.Contains(desc, "[required]") {
			param.Required = true
			desc = strings.ReplaceAll(desc, "[required]", "")
		} else if strings.Contains(desc, "[optional]") {
			param.Required = false
			desc = strings.ReplaceAll(desc, "[optional]", "")
		}
		param.Description = strings.TrimSpace(desc)
	}

	return param
}

func (l *Loader) GetSkill(name string) (*SkillDefinition, bool) {
	skill, ok := l.skills[name]
	return skill, ok
}

func (l *Loader) ListSkills() []*SkillDefinition {
	var skills []*SkillDefinition
	for _, s := range l.skills {
		skills = append(skills, s)
	}
	return skills
}

func (l *Loader) RegisterInEngine(engine *Engine) error {
	for _, skill := range l.skills {
		tool := &fileBasedSkill{
			name:         skill.Name,
			description:  skill.Description,
			instructions: skill.Instructions,
			parameters:   skill.Parameters,
		}
		engine.Register(tool)
	}
	return nil
}

func (l *Loader) loadSkillResources(skill *SkillDefinition) {
	skill.Scripts = make(map[string]string)
	skill.Examples = make(map[string]string)
	skill.Assets = make(map[string]string)
	skill.References = make(map[string]string)

	l.loadDirContents(filepath.Join(skill.SkillDir, "scripts"), skill.Scripts)
	l.loadDirContents(filepath.Join(skill.SkillDir, "examples"), skill.Examples)
	l.loadDirContents(filepath.Join(skill.SkillDir, "assets"), skill.Assets)
	l.loadDirContents(filepath.Join(skill.SkillDir, "references"), skill.References)
}

func (l *Loader) loadDirContents(dirPath string, target map[string]string) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return
	}

	for _, entry := range entries {
		if entry.IsDir() {
			subDir := filepath.Join(dirPath, entry.Name())
			l.loadDirContents(subDir, target)
			continue
		}

		filePath := filepath.Join(dirPath, entry.Name())
		content, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}

		relPath, _ := filepath.Rel(filepath.Dir(dirPath), filePath)
		target[relPath] = string(content)
	}
}

func (l *Loader) GetSkillScript(skillName, scriptName string) (string, bool) {
	skill, ok := l.skills[skillName]
	if !ok {
		return "", false
	}
	script, ok := skill.Scripts[scriptName]
	return script, ok
}

func (l *Loader) GetSkillExample(skillName, exampleName string) (string, bool) {
	skill, ok := l.skills[skillName]
	if !ok {
		return "", false
	}
	example, ok := skill.Examples[exampleName]
	return example, ok
}

func (l *Loader) GetSkillAsset(skillName, assetName string) (string, bool) {
	skill, ok := l.skills[skillName]
	if !ok {
		return "", false
	}
	asset, ok := skill.Assets[assetName]
	return asset, ok
}

func (l *Loader) ListSkillScripts(skillName string) []string {
	skill, ok := l.skills[skillName]
	if !ok {
		return nil
	}
	var scripts []string
	for name := range skill.Scripts {
		scripts = append(scripts, name)
	}
	return scripts
}

func (l *Loader) ListSkillExamples(skillName string) []string {
	skill, ok := l.skills[skillName]
	if !ok {
		return nil
	}
	var examples []string
	for name := range skill.Examples {
		examples = append(examples, name)
	}
	return examples
}

func (l *Loader) ListSkillAssets(skillName string) []string {
	skill, ok := l.skills[skillName]
	if !ok {
		return nil
	}
	var assets []string
	for name := range skill.Assets {
		assets = append(assets, name)
	}
	return assets
}

func (l *Loader) GetSkillReference(skillName, refName string) (string, bool) {
	skill, ok := l.skills[skillName]
	if !ok {
		return "", false
	}
	ref, ok := skill.References[refName]
	return ref, ok
}

func (l *Loader) ListSkillReferences(skillName string) []string {
	skill, ok := l.skills[skillName]
	if !ok {
		return nil
	}
	var refs []string
	for name := range skill.References {
		refs = append(refs, name)
	}
	return refs
}

type fileBasedSkill struct {
	name         string
	description  string
	instructions string
	parameters   map[string]SkillParameterDef
}

func (s *fileBasedSkill) Name() string {
	return s.name
}

func (s *fileBasedSkill) Description() string {
	return s.description
}

func (s *fileBasedSkill) Run(ctx context.Context, params map[string]interface{}) (string, error) {
	return s.instructions, nil
}

func (s *fileBasedSkill) Artifacts() map[string]interface{} {
	return nil
}

func (s *fileBasedSkill) GetInstructions() string {
	return s.instructions
}

func (s *fileBasedSkill) GetParameters() map[string]SkillParameterDef {
	return s.parameters
}
