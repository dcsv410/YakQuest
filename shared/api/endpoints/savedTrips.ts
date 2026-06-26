import type { ApiClient } from "../../network";
import type { SavedTrip } from "../../models";
import {
  type CreateSavedTripRequestDTO,
  type SavedTripResponseDTO,
  type UpdateSavedTripRequestDTO,
  savedTripFromApi,
  savedTripToApi,
} from "../../dto";

export const savedTripsApi = {
  async list(client: ApiClient): Promise<SavedTrip[]> {
    const trips = await client.get<SavedTripResponseDTO[]>("/trips");
    return trips.map(savedTripFromApi);
  },

  async create(
    client: ApiClient,
    trip: Omit<SavedTrip, "id" | "createdAt" | "updatedAt">
  ): Promise<SavedTrip> {
    const payload = savedTripToApi(trip) as CreateSavedTripRequestDTO;

    const apiTrip = await client.post<
      SavedTripResponseDTO,
      CreateSavedTripRequestDTO
    >("/trips", payload);

    return savedTripFromApi(apiTrip);
  },

  async update(
    client: ApiClient,
    id: string,
    patch: Partial<SavedTrip>
  ): Promise<SavedTrip> {
    const payload: UpdateSavedTripRequestDTO = savedTripToApi(patch);

    const apiTrip = await client.patch<
      SavedTripResponseDTO,
      UpdateSavedTripRequestDTO
    >(`/trips/${id}`, payload);

    return savedTripFromApi(apiTrip);
  },

  async delete(client: ApiClient, id: string): Promise<void> {
    await client.delete(`/trips/${id}`);
  },
};