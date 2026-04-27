export interface AgentMention {
  name: string;
  task: string;
}

export interface SkillCommand {
  name: string;
  args: string;
}

export interface ParsedInput {
  mainTask: string;
  agentMentions: AgentMention[];
  skillCommands: SkillCommand[];
  originalText: string;
}

export function parseInput(text: string): ParsedInput {
  const agentMentionRegex = /@(\w+)\s+(.+?)(?=(?:@\w+\s)|(?:\/\w+\s)|$)/g;
  const skillCommandRegex = /\/(\w+)\s+(.+?)(?=(?:@\w+\s)|(?:\/\w+\s)|$)/g;

  const agentMentions: AgentMention[] = [];
  const skillCommands: SkillCommand[] = [];

  let match;

  while ((match = agentMentionRegex.exec(text)) !== null) {
    agentMentions.push({
      name: match[1],
      task: match[2].trim(),
    });
  }

  while ((match = skillCommandRegex.exec(text)) !== null) {
    skillCommands.push({
      name: match[1],
      args: match[2].trim(),
    });
  }

  let mainTask = text
    .replace(/@\w+\s+.+?(?=(?:@\w+\s)|(?:\/\w+\s)|$)/g, "")
    .replace(/\/\w+\s+.+?(?=(?:@\w+\s)|(?:\/\w+\s)|$)/g, "")
    .trim();

  return {
    mainTask,
    agentMentions,
    skillCommands,
    originalText: text,
  };
}

export function hasAgentMentions(text: string): boolean {
  return /@\w+/.test(text);
}

export function hasSkillCommands(text: string): boolean {
  return /\/\w+/.test(text);
}
