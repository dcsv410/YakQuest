import type { ApiClient } from "../../network";
import type {
  ContributionResponseDTO,
  CreateContributionRequestDTO,
} from "../../dto";

export const contributionsApi = {
  listMine(
    client: ApiClient
  ): Promise<ContributionResponseDTO[]> {
    return client.get<
      ContributionResponseDTO[]
    >("/contributions");
  },
  listAdmin(client: ApiClient): Promise<ContributionResponseDTO[]> {
    return client.get<ContributionResponseDTO[]>("/admin/contributions");
  },

  submit(
    client: ApiClient,
    payload: CreateContributionRequestDTO
  ): Promise<ContributionResponseDTO> {
    return client.post<ContributionResponseDTO, CreateContributionRequestDTO>(
      "/contributions",
      payload
    );
  },

  approve(
    client: ApiClient,
    id: string
  ): Promise<ContributionResponseDTO> {
    return client.post<ContributionResponseDTO>(
      `/admin/contributions/${id}/approve`
    );
  },

  reject(
    client: ApiClient,
    id: string
  ): Promise<ContributionResponseDTO> {
    return client.post<ContributionResponseDTO>(
      `/admin/contributions/${id}/reject`
    );
  },

  apply(client: ApiClient, id: string): Promise<ContributionResponseDTO> {
    return client.post<ContributionResponseDTO>(
      `/admin/contributions/${id}/attach-river`
    );
  },
};