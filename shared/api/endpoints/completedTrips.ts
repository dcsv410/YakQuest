import type { ApiClient } from "../../network";
import type { CompletedTrip } from "../../models";
import {
  type CompletedTripResponseDTO,
  type CreateCompletedTripRequestDTO,
  type UpdateCompletedTripRequestDTO,
  completedTripFromApi,
} from "../../dto";

export const completedTripsApi = {
  async list(client: ApiClient): Promise<CompletedTrip[]> {
    const trips = await client.get<CompletedTripResponseDTO[]>(
      "/completed-trips"
    );

    return trips.map(completedTripFromApi);
  },

  async create(
    client: ApiClient,
    payload: CreateCompletedTripRequestDTO
  ): Promise<CompletedTrip> {
    const trip = await client.post<
      CompletedTripResponseDTO,
      CreateCompletedTripRequestDTO
    >("/completed-trips", payload);

    return completedTripFromApi(trip);
  },

  async update(
    client: ApiClient,
    id: string,
    payload: UpdateCompletedTripRequestDTO
  ): Promise<CompletedTrip> {
    const trip = await client.patch<
      CompletedTripResponseDTO,
      UpdateCompletedTripRequestDTO
    >(`/completed-trips/${id}`, payload);

    return completedTripFromApi(trip);
  },

  async delete(client: ApiClient, id: string): Promise<void> {
    await client.delete(`/completed-trips/${id}`);
  },
};