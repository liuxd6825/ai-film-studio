import { fileApi } from "@/api/chatClient";
import { useChatStore } from "@/stores/chatStore";

export interface FileContent {
  path: string;
  content: string;
  language?: string;
}

export interface WritePreview {
  path: string;
  content: string;
  changes: {
    linesAdded: number;
    linesRemoved: number;
  };
  warning: string;
}

export async function readFile(path: string): Promise<FileContent> {
  const response = await fileApi.read(path);
  return {
    path,
    content: response.content,
    language: detectLanguage(path),
  };
}

export async function writeFile(path: string, content: string): Promise<void> {
  const currentSession = useChatStore.getState().currentSession;

  if (currentSession?.mode === "plan") {
    throw new Error("Cannot write files in Plan mode. Switch to Build mode.");
  }

  await fileApi.write(path, content);
}

export async function previewWrite(
  path: string,
  content: string,
): Promise<WritePreview> {
  await fileApi.preview(path, content);
  return {
    path,
    content,
    changes: {
      linesAdded: content.split("\n").length,
      linesRemoved: 0,
    },
    warning: "This operation will be executed in Build mode.",
  };
}

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    go: "go",
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rs: "rust",
    java: "java",
    md: "markdown",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    html: "html",
    css: "css",
  };
  return langMap[ext || ""] || "text";
}
