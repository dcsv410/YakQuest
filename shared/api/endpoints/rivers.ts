import type { ApiClient } from "../../network";
import type {
  CreateRiverRequestDTO,
  RiverResponseDTO,
  UpdateRiverRequestDTO,
  UpdateRiverPointRequestDTO,
  RiverPointResponseDTO,
  CreateRiverPointRequestDTO,
  AdminRiverResponseDTO,
  OutfitterResponseDTO,
} from "../../dto";

export const riversApi = {
  getAdmin(
    client: ApiClient,
    id: string
  ): Promise<AdminRiverResponseDTO> {
    return client.get<AdminRiverResponseDTO>(`/admin/rivers/${id}`);
  },
  list(client: ApiClient): Promise<RiverResponseDTO[]> {
    return client.get<RiverResponseDTO[]>("/rivers");
  },

  listOutfitters(
    client: ApiClient,
    riverId: string
  ): Promise<OutfitterResponseDTO[]> {
    return client.get<OutfitterResponseDTO[]>(
      `/rivers/${riverId}/outfitters`
    );
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

  create(
    client: ApiClient,
    payload: CreateRiverRequestDTO
  ): Promise<RiverResponseDTO> {
    return client.post<RiverResponseDTO, CreateRiverRequestDTO>(
      "/admin/rivers",
      payload
    );
  },
};