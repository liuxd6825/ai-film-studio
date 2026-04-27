export interface Project {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  status: number;
  duration: string;
  style: string;
  created_at: number;
  updated_at: number;
}

export interface Tag {
  id: string;
  name: string;
  project_count: number;
}

export interface Style {
  id: string;
  name: string;
  sort_order: number;
}

export type SortOption = "created_at" | "updated_at" | "name" | "tag_count";
export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SortOption;
  direction: SortDirection;
}

export const PROJECT_STATUS = [
  { value: 0, label: "草稿", color: "gray" },
  { value: 1, label: "进行中", color: "blue" },
  { value: 2, label: "已完成", color: "green" },
] as const;
