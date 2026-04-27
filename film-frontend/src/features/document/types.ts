export interface Folder {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface Document {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  content: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface FileItem {
  id: string;
  projectId: string;
  folderId: string | null;
  rootPath: string;
  filePath: string;
  name: string;
  ext: string;
  isDir: boolean;
  content?: string;
  fileSize: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface TreeNode {
  id: string;
  type: "folder" | "file";
  name: string;
  parent_id: string | null;
  children: TreeNode[];
  isExpanded?: boolean;
  content?: string;
}

export function buildTree(folders: Folder[], files: FileItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  folders.forEach((f) => {
    map.set(f.id, {
      id: f.id,
      type: "folder",
      name: f.name,
      parent_id: f.parentId,
      children: [],
      isExpanded: true,
    });
  });

  files.forEach((f) => {
    map.set(f.id, {
      id: f.id,
      type: "file",
      name: f.name,
      parent_id: f.folderId,
      children: [],
      content: f.content,
    });
  });

  folders.forEach((f) => {
    const node = map.get(f.id)!;
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  files.forEach((f) => {
    const node = map.get(f.id)!;
    if (f.folderId && map.has(f.folderId)) {
      map.get(f.folderId)!.children.push(node);
    } else if (!f.folderId) {
      roots.push(node);
    }
  });

  roots.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return roots;
}
