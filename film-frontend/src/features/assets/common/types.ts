// Asset types for the assets module

export type AssetType = "character" | "scene" | "prop";

export type AssetStatus = 0 | 1 | 2; // 0=草稿, 1=已批准, 2=已修订

export interface Asset {
  id: string;
  orgId: string;
  projectId: string;
  name: string;
  desc: string;
  kind: AssetType;
  type: string;
  status: AssetStatus;
  appearance?: string;
  personality?: string;
  background?: string;
  abilities?: string;
  faction?: string;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type SortField = "createdAt" | "name";
export type SortOrder = "asc" | "desc";

export interface CreateAssetRequest {
  orgId: string;
  name: string;
  desc?: string;
  type?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  abilities?: string;
  faction?: string;
  coverImageId?: string; // For saving the selected cover
}

export interface UpdateAssetRequest {
  name: string;
  desc?: string;
  type?: string;
  status?: AssetStatus;
  appearance?: string;
  personality?: string;
  background?: string;
  abilities?: string;
  faction?: string;
  coverImageId?: string; // For saving the selected cover
}

export const STATUS_LABELS: Record<AssetStatus, string> = {
  0: "草稿",
  1: "已批准",
  2: "已修订",
};

export const STATUS_COLORS: Record<AssetStatus, string> = {
  0: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  1: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

export const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "时间（最新）" },
  { value: "createdAt-asc", label: "时间（最早）" },
  { value: "name-asc", label: "名称（A-Z）" },
  { value: "name-desc", label: "名称（Z-A）" },
];
