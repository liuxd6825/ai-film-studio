// Scene-specific types

import type {
  Asset,
  CreateAssetRequest,
  UpdateAssetRequest,
  SortField,
  SortOrder,
} from "../common/types";

export {
  type Asset,
  type CreateAssetRequest,
  type UpdateAssetRequest,
  type SortField,
  type SortOrder,
};

export const SCENE_TYPES = [
  { value: "内景", label: "内景" },
  { value: "外景", label: "外景" },
  { value: "混合场景", label: "混合场景" },
];
