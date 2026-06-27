import type { ApiClient } from "../../network";
import type {
  RiverResponseDTO,
  UpdateRiverRequestDTO,
  UpdateRiverPointRequestDTO,
  RiverPointResponseDTO,
  CreateRiverPointRequestDTO,
} from "../../dto";

export const riversApi = {
  list(client: ApiClient): Promise<RiverResponseDTO[]> {
    return client.get<RiverResponseDTO[]>("/rivers");
  },

  updatePoint(
    client: ApiClient,
    pointId: string,
    payload: UpdateRiverPointRequestDTO
  ): Promise<RiverPointResponseDTO> {
    return client.patch<RiverPointResponseDTO, UpdateRiverPointRequestDTO>(
      `/admin/river-points/${pointId}`,
      payload
    );
  },

  update(
    client: ApiClient,
    id: string,
    payload: UpdateRiverRequestDTO
  ): Promise<RiverResponseDTO> {
    return client.patch<RiverResponseDTO, UpdateRiverRequestDTO>(
      `/admin/rivers/${id}`,
      payload
    );
  },

  createPoint(
    client: ApiClient,
    riverId: string,
    payload: CreateRiverPointRequestDTO
  ): Promise<RiverPointResponseDTO> {
    return client.post<RiverPointResponseDTO, CreateRiverPointRequestDTO>(
      `/admin/rivers/${riverId}/points`,
      payload
    );
  },
};