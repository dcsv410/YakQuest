import { completedTripsApi } from "@yakquest/shared";
import { apiClient } from "./apiClient";

export const fetchCompletedTrips = () =>
  completedTripsApi.list(apiClient);

export const updateCompletedTrip = (
  id: string,
  notes: string
) =>
  completedTripsApi.update(apiClient, id, {
    notes,
  });

export const deleteCompletedTrip = (
  id: string
) =>
  completedTripsApi.delete(apiClient, id);