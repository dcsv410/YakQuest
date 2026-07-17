import type { ApiClient } from "../../network";
import type {
  CreateRiverRequestDTO,
  RiverResponseDTO,
  UpdateRiverRequestDTO,
  UpdateRiverPointRequestDTO,
  RiverPointResponseDTO,
  CreateRiverPointRequestDTO,
  AdminRiverResponseDTO,
  CreateOutfitterRequestDTO,
  OutfitterResponseDTO,
  UpdateOutfitterRequestDTO,
  ReplaceRiverRouteRequestDTO,
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

  listAdminOutfitters(
    client: ApiClient,
    riverId: string
  ): Promise<OutfitterResponseDTO[]> {
    return client.get<OutfitterResponseDTO[]>(
      `/admin/rivers/${riverId}/outfitters`
    );
  },

  createOutfitter(
    client: ApiClient,
    payload: CreateOutfitterRequestDTO
  ): Promise<OutfitterResponseDTO> {
    return client.post<OutfitterResponseDTO, CreateOutfitterRequestDTO>(
      "/admin/outfitters",
      payload
    );
  },

  updateOutfitter(
    client: ApiClient,
    outfitterId: string,
    payload: UpdateOutfitterRequestDTO
  ): Promise<OutfitterResponseDTO> {
    return client.patch<OutfitterResponseDTO, UpdateOutfitterRequestDTO>(
      `/admin/outfitters/${outfitterId}`,
      payload
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

  replaceRoute(
    client: ApiClient,
    id: string,
    payload: ReplaceRiverRouteRequestDTO
  ): Promise<RiverResponseDTO> {
    return client.put<RiverResponseDTO, ReplaceRiverRouteRequestDTO>(
      `/admin/rivers/${id}/route`,
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

  deletePointPhoto(
    client: ApiClient,
    pointId: string,
    photoIndex: number
  ): Promise<{
    id: string;
    photos: string[];
    removedPhoto: string;
  }> {
    return client.delete<{
      id: string;
      photos: string[];
      removedPhoto: string;
    }>(`/admin/river-points/${pointId}/photos/${photoIndex}`);
  },
};