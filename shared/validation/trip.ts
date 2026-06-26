import type { CreateSavedTripRequestDTO } from "../dto";
import { invalid } from "./types";

export function validateSavedTrip(payload: CreateSavedTripRequestDTO) {
  const errors: string[] = [];

  if (!payload.riverId) errors.push("River is required.");
  if (!payload.startName) errors.push("Launch point is required.");
  if (!payload.endName) errors.push("Takeout point is required.");

  if (
    payload.startLatitude === payload.endLatitude &&
    payload.startLongitude === payload.endLongitude
  ) {
    errors.push("Launch and takeout cannot be the same point.");
  }

  if (payload.plannedDistanceMiles <= 0) {
    errors.push("Trip distance must be greater than zero.");
  }

  return invalid(errors);
}