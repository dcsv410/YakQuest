import { riversApi } from "@yakquest/shared";
import type {
  UpdateRiverRequestDTO,
  UpdateRiverPointRequestDTO,
  CreateRiverPointRequestDTO,
} from "@yakquest/shared";
import { apiClient } from "./apiClient";

export const fetchRivers = () => riversApi.list(apiClient);

export const updateRiver = (
  id: string,
  payload: UpdateRiverRequestDTO
) => riversApi.update(apiClient, id, payload);

export const updateRiverPoint = (
  pointId: string,
  payload: UpdateRiverPointRequestDTO
) => riversApi.updatePoint(apiClient, pointId, payload);

export const createRiverPoint = (
  riverId: string,
  payload: CreateRiverPointRequestDTO
) => riversApi.createPoint(apiClient, riverId, payload);