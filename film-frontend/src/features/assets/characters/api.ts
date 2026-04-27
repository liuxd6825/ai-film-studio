import { api } from "@/api/client";
import type {
  Asset,
  CreateAssetRequest,
  UpdateAssetRequest,
} from "../common/types";

const BASE_PATH = "/api/v1";

export const characterApi = {
  list: (projectId: string) =>
    api.get<Asset[]>(`${BASE_PATH}/projects/${projectId}/characters`),

  create: (projectId: string, data: CreateAssetRequest) =>
    api.post<Asset>(`${BASE_PATH}/projects/${projectId}/characters`, data),

  update: (id: string, data: UpdateAssetRequest) =>
    api.put<Asset>(`${BASE_PATH}/characters/${id}`, data),

  delete: (id: string) => api.delete(`${BASE_PATH}/characters/${id}`),
};
