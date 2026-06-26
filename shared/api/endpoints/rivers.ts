import type { ApiClient } from "../../network";
import type {
  RiverResponseDTO,
  UpdateRiverRequestDTO,
} from "../../dto";

export const riversApi = {
  list(client: ApiClient): Promise<RiverResponseDTO[]> {
    return client.get<RiverResponseDTO[]>("/rivers");
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
};