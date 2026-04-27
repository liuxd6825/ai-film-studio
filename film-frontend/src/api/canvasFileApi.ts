export interface CanvasFile {
  id: string;
  projectId: string;
  nodeId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  createdAt: number;
}

export interface UploadCanvasFileResponse {
  id: string;
  downloadUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export const canvasFileApi = {
  upload: (
    projectId: string,
    canvasId: string,
    nodeId: string,
    file: File,
  ): Promise<UploadCanvasFileResponse> => {
    const formData = new FormData();
    formData.append("node_id", nodeId);
    formData.append("file", file);

    return fetch(
      `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/projects/${projectId}/canvas/files/upload?canvas_id=${canvasId}`,
      {
        method: "POST",
        body: formData,
      },
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 0 && json.code !== 200) {
          throw new Error(json.message || "Upload failed");
        }
        return json.data as UploadCanvasFileResponse;
      });
  },

  getNodeFileCount: (
    projectId: string,
    canvasId: string,
    nodeId: string,
  ): Promise<number> => {
    return fetch(
      `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/projects/${projectId}/canvas/files/count?node_id=${nodeId}&canvas_id=${canvasId}`,
      {
        method: "GET",
      },
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 0 && json.code !== 200) {
          throw new Error(json.message || "Failed to get file count");
        }
        return json.data.count as number;
      });
  },
};
