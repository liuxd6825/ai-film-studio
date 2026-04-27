import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Login } from "./features/auth/Login";
import { ProjectDashboard } from "./features/dashboard/ProjectDashboard";
import { DashboardLayout } from "./features/dashboard/DashboardLayout";

export function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (_userId: string, _orgId: string) => {
    navigate("/dashboard");
  };

  return <Login onLogin={handleLogin} />;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const storedOrgId = localStorage.getItem("org_id");
    if (storedOrgId) {
      setOrgId(storedOrgId);
    }
  }, []);

  const handleSelectProject = (projectId: string, _projectName: string) => {
    navigate(`/project/${projectId}/home`);
  };

  if (!orgId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">加载中...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ProjectDashboard orgId={orgId} onSelectProject={handleSelectProject} />
    </DashboardLayout>
  );
}
