package skill

import (
	"fmt"
	"regexp"
	"strings"
)

type Command struct {
	SkillName string
	Args      string
	Raw       string
}

var pattern = regexp.MustCompile(`^/(\w+)(?:\s+(.*))?$`)

func ParseCommand(input string) *Command {
	if !strings.HasPrefix(input, "/") {
		return nil
	}
	matches := pattern.FindStringSubmatch(strings.TrimSpace(input))
	if matches == nil {
		return nil
	}
	return &Command{
		SkillName: matches[1],
		Args:      strings.TrimSpace(matches[2]),
		Raw:       input,
	}
}

func (c *Command) ToInstruction() string {
	return fmt.Sprintf(
		`请使用 skill 工具：skill="%s", input="%s"`,
		c.SkillName, c.Args,
	)
}
