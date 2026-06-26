import type { ApiClient } from "../../network";
import type { RiverResponseDTO } from "../../dto";

export const riversApi = {
  list(client: ApiClient): Promise<RiverResponseDTO[]> {
    return client.get<RiverResponseDTO[]>("/rivers");
  },
};