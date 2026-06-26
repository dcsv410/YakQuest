import { riversApi } from "@yakquest/shared";
import type { UpdateRiverRequestDTO } from "@yakquest/shared";
import { apiClient } from "./apiClient";

export const fetchRivers = () => riversApi.list(apiClient);

export const updateRiver = (
  id: string,
  payload: UpdateRiverRequestDTO
) => riversApi.update(apiClient, id, payload);