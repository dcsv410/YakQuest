import type { RiverResponseDTO } from "@yakquest/shared";
import { apiClient } from "./apiClient";

export async function fetchRivers(): Promise<RiverResponseDTO[]> {
  return apiClient.get<RiverResponseDTO[]>("/rivers");
}