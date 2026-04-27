// Character-specific types

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

export const CHARACTER_TYPES = [
  { value: "主演", label: "主演" },
  { value: "配角", label: "配角" },
  { value: "群众", label: "群众" },
  { value: "动物", label: "动物" },
  { value: "怪物", label: "怪物" },
  { value: "机器", label: "机器" },
  { value: "其他", label: "其他" },
];
