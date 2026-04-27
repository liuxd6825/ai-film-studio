import { useState } from "react";
import { api } from "@/api/client";

interface LoginResponse {
  id: string;
  username: string;
  org_id: string;
}

export function Login({
  onLogin,
}: {
  onLogin: (userId: string, orgId: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post<LoginResponse>("/api/v1/auth/login", {
        username,
        password,
      });
      console.log("Login Response:", res);
      localStorage.setItem("user_id", res.id);
      localStorage.setItem("org_id", res.org_id);
      onLogin(res.id, res.org_id);
    } catch (e) {
      setError("登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full bg-gray-50 dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="p-8 border border-gray-200 dark:border-gray-700 rounded-lg shadow bg-white dark:bg-gray-800 w-96">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">登录</h2>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="用户名"
          className="w-full mb-4 p-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
          className="w-full mb-4 p-2 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
        {error && <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
    </div>
  );
}
