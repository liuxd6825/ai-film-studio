import { api } from "@/api/client";
import type {
  Asset,
  CreateAssetRequest,
  UpdateAssetRequest,
} from "../common/types";

const BASE_PATH = "/api/v1";

export const propApi = {
  list: (projectId: string) =>
    api.get<Asset[]>(`${BASE_PATH}/projects/${projectId}/props`),

  create: (projectId: string, data: CreateAssetRequest) =>
    api.post<Asset>(`${BASE_PATH}/projects/${projectId}/props`, data),

  update: (id: string, data: UpdateAssetRequest) =>
    api.put<Asset>(`${BASE_PATH}/props/${id}`, data),

  delete: (id: string) => api.delete(`${BASE_PATH}/props/${id}`),
};
