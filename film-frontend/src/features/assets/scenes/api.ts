import { api } from "@/api/client";
import type {
  Asset,
  CreateAssetRequest,
  UpdateAssetRequest,
} from "../common/types";

const BASE_PATH = "/api/v1";

export const sceneApi = {
  list: (projectId: string) =>
    api.get<Asset[]>(`${BASE_PATH}/projects/${projectId}/scenes`),

  create: (projectId: string, data: CreateAssetRequest) =>
    api.post<Asset>(`${BASE_PATH}/projects/${projectId}/scenes`, data),

  update: (id: string, data: UpdateAssetRequest) =>
    api.put<Asset>(`${BASE_PATH}/scenes/${id}`, data),

  delete: (id: string) => api.delete(`${BASE_PATH}/scenes/${id}`),
};
