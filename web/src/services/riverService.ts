import { riversApi } from "@yakquest/shared";
import type {
  CreateRiverRequestDTO,
  CreateRiverPointRequestDTO,
  UpdateRiverPointRequestDTO,
  UpdateRiverRequestDTO,
  CreateOutfitterRequestDTO,
  UpdateOutfitterRequestDTO,
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

export const fetchAdminRiverOutfitters = (riverId: string) =>
  riversApi.listAdminOutfitters(apiClient, riverId);

export const createOutfitter = (payload: CreateOutfitterRequestDTO) =>
  riversApi.createOutfitter(apiClient, payload);

export const updateOutfitter = (
  outfitterId: string,
  payload: UpdateOutfitterRequestDTO
) => riversApi.updateOutfitter(apiClient, outfitterId, payload);