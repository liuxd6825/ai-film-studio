import { memo } from "react";
import type { Asset, AssetType } from "./types";
import { STATUS_LABELS, STATUS_COLORS } from "./types";

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
}

const TYPE_ICONS: Record<AssetType, React.ReactNode> = {
  character: (
    <svg
      className="w-8 h-8 text-blue-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  scene: (
    <svg
      className="w-8 h-8 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  prop: (
    <svg
      className="w-8 h-8 text-orange-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
};

export const AssetCard = memo(function AssetCard({
  asset,
  onEdit,
}: AssetCardProps) {
  const hasImage = !!asset.coverUrl;

  return (
    <div
      onClick={() => onEdit(asset)}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-center w-full h-20 bg-gray-50 dark:bg-gray-700/50 rounded-md mb-3 overflow-hidden">
        {hasImage ? (
          <img
            src={asset.coverUrl}
            alt={asset.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (
                e.target as HTMLImageElement
              ).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={hasImage ? "hidden" : ""}>{TYPE_ICONS[asset.kind]}</div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate" title={asset.name}>
          {asset.name}
        </h3>

        {asset.type && (
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{asset.type}</p>
        )}

        <span
          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
            STATUS_COLORS[asset.status]
          }`}
        >
          {STATUS_LABELS[asset.status]}
        </span>
      </div>
    </div>
  );
});
