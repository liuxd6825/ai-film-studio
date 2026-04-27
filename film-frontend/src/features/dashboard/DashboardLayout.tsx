import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="h-12 border-b flex items-center px-4 bg-white dark:bg-gray-800">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          我的项目
        </h1>
        <div className="flex-1" />
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
        >
          {theme === "dark" ? (
            <Sun size={18} className="text-gray-400" />
          ) : (
            <Moon size={18} className="text-gray-600" />
          )}
        </button>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
