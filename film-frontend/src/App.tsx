import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useChatStore } from "./stores/chatStore";
import { useThemeStore } from "./stores/themeStore";

export default function App() {
  const chatStoreSetProjectId = useChatStore((state) => state.setProjectId);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const storedOrgId = localStorage.getItem("org_id");
    if (!storedOrgId) {
      return;
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    return () => {
      chatStoreSetProjectId("");
    };
  }, [chatStoreSetProjectId]);

  return <Outlet />;
}
