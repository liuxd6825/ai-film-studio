import { api } from "./client";
import type { ImageEditWorkMode } from "../features/canvas/domain/canvasNodes";

export interface AIModel {
  id: string;
  title: string;
  provider: string;
}

export const aimodelApi = {
  listByWorkMode: (workMode: ImageEditWorkMode): Promise<AIModel[]> =>
    api.get<AIModel[]>(`/api/v1/ai-models?workMode=${workMode}`),
};