import { riversApi } from "@yakquest/shared";
import type {
  CreateRiverRequestDTO,
  CreateRiverPointRequestDTO,
  UpdateRiverPointRequestDTO,
  UpdateRiverRequestDTO,
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

export const createRiver = (payload: CreateRiverRequestDTO) =>
  riversApi.create(apiClient, payload);

export const fetchAdminRiver = (id: string) =>
  riversApi.getAdmin(apiClient, id);

export const fetchRiverOutfitters = (riverId: string) =>
  riversApi.listOutfitters(apiClient, riverId);