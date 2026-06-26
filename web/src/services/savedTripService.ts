import { savedTripsApi } from "@yakquest/shared";
import type { SavedTrip } from "@yakquest/shared";
import { apiClient } from "./apiClient";

export const fetchSavedTrips = () => savedTripsApi.list(apiClient);

export const createSavedTrip = (
  trip: Omit<SavedTrip, "id" | "createdAt" | "updatedAt">
) => savedTripsApi.create(apiClient, trip);

export const updateSavedTrip = (
  id: string,
  patch: Partial<SavedTrip>
) => savedTripsApi.update(apiClient, id, patch);

export const deleteSavedTrip = (id: string) =>
  savedTripsApi.delete(apiClient, id);