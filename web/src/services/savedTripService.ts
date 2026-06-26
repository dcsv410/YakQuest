import type { SavedTrip } from "@yakquest/shared";
import {
  type CreateSavedTripRequestDTO,
  type SavedTripResponseDTO,
  type UpdateSavedTripRequestDTO,
  savedTripFromApi,
  savedTripToApi,
} from "@yakquest/shared";
import { apiClient } from "./apiClient";

export async function fetchSavedTrips(): Promise<SavedTrip[]> {
  const apiTrips = await apiClient.get<SavedTripResponseDTO[]>("/trips");

  return apiTrips.map(savedTripFromApi);
}

export async function createSavedTrip(
  trip: Omit<SavedTrip, "id" | "createdAt" | "updatedAt">
): Promise<SavedTrip> {
  const payload = savedTripToApi(trip) as CreateSavedTripRequestDTO;

  const apiTrip = await apiClient.post<
    SavedTripResponseDTO,
    CreateSavedTripRequestDTO
  >("/trips", payload);

  return savedTripFromApi(apiTrip);
}

export async function updateSavedTrip(
  id: string,
  patch: Partial<SavedTrip>
): Promise<SavedTrip> {
  const payload: UpdateSavedTripRequestDTO = savedTripToApi(patch);

  const apiTrip = await apiClient.patch<
    SavedTripResponseDTO,
    UpdateSavedTripRequestDTO
  >(`/trips/${id}`, payload);

  return savedTripFromApi(apiTrip);
}

export async function deleteSavedTrip(id: string) {
  await apiClient.delete(`/trips/${id}`);
}