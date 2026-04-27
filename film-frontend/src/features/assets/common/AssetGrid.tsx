import { memo } from "react";
import type { Asset } from "./types";
import { AssetCard } from "./AssetCard";

interface AssetGridProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  loading: boolean;
}

export const AssetGrid = memo(function AssetGrid({
  assets,
  onEdit,
  loading,
}: AssetGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500 dark:text-gray-400">加载中...</span>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-gray-400 dark:text-gray-500">暂无数据</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} onEdit={onEdit} />
      ))}
    </div>
  );
});
