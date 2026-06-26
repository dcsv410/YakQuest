import type { CompletedTrip } from "../models";

export type CompletedTripResponseDTO = {
  id: string;

  user_id: string;
  river_id: string;

  river_name: string;
  state?: string | null;

  start_name?: string | null;
  end_name?: string | null;

  planned_distance_miles?: number | null;
  actual_distance_miles?: number | null;

  elapsed_time_seconds?: number | null;

  started_at?: string | null;
  completed_at: string;

  notes?: string | null;

  created_at: string;
  updated_at?: string | null;
};

export type CreateCompletedTripRequestDTO = {
  riverId: string;
  riverName: string;
  state?: string | null;

  startName?: string | null;
  endName?: string | null;

  plannedDistanceMiles?: number | null;
  actualDistanceMiles?: number | null;

  elapsedTimeSeconds?: number | null;

  startedAt?: string | null;
  completedAt: string;

  notes?: string | null;
};

export type UpdateCompletedTripRequestDTO = {
  notes?: string | null;
};

export function completedTripFromApi(
  api: CompletedTripResponseDTO
): CompletedTrip {
  return {
    id: api.id,
    riverId: api.river_id,
    riverName: api.river_name,
    state: api.state,

    startName: api.start_name,
    endName: api.end_name,

    plannedDistanceMiles: api.planned_distance_miles,
    actualDistanceMiles: api.actual_distance_miles,

    elapsedTimeSeconds: api.elapsed_time_seconds,

    startedAt: api.started_at,
    completedAt: api.completed_at,

    notes: api.notes,

    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function completedTripToApi(
  trip: CreateCompletedTripRequestDTO
): CreateCompletedTripRequestDTO {
  return trip;
}