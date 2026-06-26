import type { ApiClient } from "../../network";
import type {
  ContributionResponseDTO,
  CreateContributionRequestDTO,
  ReviewContributionRequestDTO,
} from "../../dto";

export const contributionsApi = {
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

  review(
    client: ApiClient,
    id: string,
    payload: ReviewContributionRequestDTO
  ): Promise<ContributionResponseDTO> {
    return client.patch<ContributionResponseDTO, ReviewContributionRequestDTO>(
      `/admin/contributions/${id}`,
      payload
    );
  },

  apply(client: ApiClient, id: string): Promise<ContributionResponseDTO> {
    return client.post<ContributionResponseDTO>(
      `/admin/contributions/${id}/apply`
    );
  },
};