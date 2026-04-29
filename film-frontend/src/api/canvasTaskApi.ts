export type TaskStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "unknown";

export interface TaskStatusResponse {
  id: string;
  canvasId: string;
  nodeId: string;
  projectId: string;
  taskType: string;
  provider: string;
  model: string;
  prompt: string;
  status: number;
  statusText: TaskStatus;
  resultUrl?: string;
  errorMessage?: string;
  progress: number;
  createdAt: number;
  updatedAt: number;
}

export interface ImageResult {
  resultId: string;
  taskId: string;
  url: string;
  width: number;
  height: number;
  createdAt: number;
}

export interface VideoResult {
  resultId: string;
  taskId: string;
  url: string;
  width: number;
  height: number;
  duration: number;
  createdAt: number;
}

export interface NodeTaskImagesResponse {
  images: ImageResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NodeTaskVideosResponse {
  videos: VideoResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:17781";

export const canvasTaskApi = {
  getStatus: (
    projectId: string,
    taskId: string,
  ): Promise<TaskStatusResponse> => {
    return fetch(
      `${API_BASE_URL}/api/v1/projects/${projectId}/canvas/tasks/${taskId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 0 && json.code !== 200) {
          throw new Error(json.message || "Failed to get task status");
        }
        return json.data as TaskStatusResponse;
      });
  },

  poll: (
    projectId: string,
    taskId: string,
    workspace?: string,
  ): Promise<TaskStatusResponse> => {
    const url = new URL(
      `${API_BASE_URL}/api/v1/projects/${projectId}/canvas/tasks/${taskId}/poll`,
    );
    if (workspace) {
      url.searchParams.set("workspace", workspace);
    }

    return fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 0 && json.code !== 200) {
          throw new Error(json.message || "Failed to poll task status");
        }
        return json.data as TaskStatusResponse;
      });
  },

  cancel: (
    projectId: string,
    taskId: string,
    workspace?: string,
  ): Promise<TaskStatusResponse> => {
    const url = new URL(
      `${API_BASE_URL}/api/v1/projects/${projectId}/canvas/tasks/${taskId}/cancel`,
    );
    if (workspace) {
      url.searchParams.set("workspace", workspace);
    }

    return fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 0 && json.code !== 200) {
          throw new Error(json.message || "Failed to cancel task");
        }
        return json.data as TaskStatusResponse;
      });
  },

  getNodeTaskImages: (
    projectId: string,
    nodeId: string,
    page?: number,
    pageSize?: number,
  ): Promise<NodeTaskImagesResponse> => {
    const url = new URL(
      `${API_BASE_URL}/api/v1/projects/${projectId}/canvas/nodes/${nodeId}/task-images`,
    );
    if (page) {
      url.searchParams.set("page", String(page));
    }
    if (pageSize) {
      url.searchParams.set("pageSize", String(pageSize));
    }

    return fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 0 && json.code !== 200) {
          throw new Error(json.message || "Failed to get node task images");
        }
        return json.data as NodeTaskImagesResponse;
      });
  },

  getNodeTaskImagesCount: (
    projectId: string,
    nodeId: string,
  ): Promise<number> => {
    const url = new URL(
      `${API_BASE_URL}/api/v1/projects/${projectId}/canvas/nodes/${nodeId}/task-images/count`,
    );

    return fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 0 && json.code !== 200) {
          throw new Error(json.message || "Failed to get node task images count");
        }
        return json.data.count as number;
      });
  },

  getNodeTaskVideos: (
    projectId: string,
    nodeId: string,
    page?: number,
    pageSize?: number,
  ): Promise<NodeTaskVideosResponse> => {
    const url = new URL(
      `${API_BASE_URL}/api/v1/projects/${projectId}/canvas/nodes/${nodeId}/task-videos`,
    );
    if (page) {
      url.searchParams.set("page", String(page));
    }
    if (pageSize) {
      url.searchParams.set("pageSize", String(pageSize));
    }

    return fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 0 && json.code !== 200) {
          throw new Error(json.message || "Failed to get node task videos");
        }
        return json.data as NodeTaskVideosResponse;
      });
  },
};
