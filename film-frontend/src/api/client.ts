const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string>,
): Promise<T> {
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const options: RequestInit = { method, headers };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const json: ApiResponse<T> = await res.json();

  if (json.code !== 0 && json.code !== 200) {
    throw new Error(json.message || "API request failed");
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) => request<T>("GET", path, undefined, params),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
  upload: <T>(path: string, file: File, folderId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (folderId) {
      formData.append("folder_id", folderId);
    }
    return fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      body: formData,
    }).then((res) => res.json()) as Promise<T>;
  },
};
