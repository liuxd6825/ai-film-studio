import { useState } from "react";
import { type LucideIcon } from "lucide-react";

interface ModuleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

export function ModuleCard({
  icon: Icon,
  title,
  description,
  onClick,
}: ModuleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-200 cursor-pointer ${
        isHovered
          ? "shadow-lg -translate-y-0.5 border-blue-100 dark:border-blue-900"
          : "shadow-sm border-gray-100 dark:border-gray-700"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="p-6">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
            isHovered ? "bg-blue-50 dark:bg-blue-900/30 text-blue-500" : "bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
          }`}
        >
          <Icon size={24} />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-2">{title}</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}