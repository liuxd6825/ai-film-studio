import { Input, Button, Select } from "antd";
import type { AssetType, SortField, SortOrder } from "./types";
import { SORT_OPTIONS } from "./types";

interface AssetToolbarProps {
  assetType: AssetType;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  onCreate: () => void;
}

const PLACEHOLDERS: Record<AssetType, string> = {
  character: "搜索角色...",
  scene: "搜索场景...",
  prop: "搜索道具...",
};

const CREATE_LABELS: Record<AssetType, string> = {
  character: "新建角色",
  scene: "新建场景",
  prop: "新建道具",
};

export function AssetToolbar({
  assetType,
  searchQuery,
  onSearchChange,
  sortField,
  sortOrder,
  onSortChange,
  onCreate,
}: AssetToolbarProps) {
  const sortValue = `${sortField}-${sortOrder}`;

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-") as [SortField, SortOrder];
    onSortChange(field, order);
  };

  return (
    <div className="flex items-center gap-4 mb-4 dark:bg-gray-900/50 p-3 rounded-lg">
      <Input.Search
        placeholder={PLACEHOLDERS[assetType]}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-64"
        allowClear
      />

      <Select
        value={sortValue}
        onChange={handleSortChange}
        options={SORT_OPTIONS}
        className="w-40"
      />

      <Button type="primary" onClick={onCreate}>
        {CREATE_LABELS[assetType]}
      </Button>
    </div>
  );
}
