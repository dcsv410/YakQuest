import type { SavedTrip } from "../models";

export type SavedTripResponseDTO = {
  id: string;

  river_id: string;
  name: string | null;

  start_name: string;
  start_latitude: number;
  start_longitude: number;

  end_name: string;
  end_latitude: number;
  end_longitude: number;

  planned_distance_miles: number;
  estimated_time_min?: number | null;

  notes?: string | null;

  created_at: string;
  updated_at?: string | null;
};

export type CreateSavedTripRequestDTO = {
  riverId: string;
  name?: string | null;

  startName: string;
  startLatitude: number;
  startLongitude: number;

  endName: string;
  endLatitude: number;
  endLongitude: number;

  plannedDistanceMiles: number;
  estimatedTimeMin?: number | null;

  notes?: string | null;
};

export type UpdateSavedTripRequestDTO = Partial<CreateSavedTripRequestDTO>;

export function savedTripFromApi(api: SavedTripResponseDTO): SavedTrip {
  return {
    id: api.id,
    riverId: api.river_id,
    name: api.name,
    startName: api.start_name,
    startLatitude: api.start_latitude,
    startLongitude: api.start_longitude,
    endName: api.end_name,
    endLatitude: api.end_latitude,
    endLongitude: api.end_longitude,
    plannedDistanceMiles: api.planned_distance_miles,
    estimatedTimeMin: api.estimated_time_min,
    notes: api.notes,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function savedTripToApi(
  trip: Partial<SavedTrip>
): UpdateSavedTripRequestDTO {
  return {
    riverId: trip.riverId,
    name: trip.name,
    startName: trip.startName,
    startLatitude: trip.startLatitude,
    startLongitude: trip.startLongitude,
    endName: trip.endName,
    endLatitude: trip.endLatitude,
    endLongitude: trip.endLongitude,
    plannedDistanceMiles: trip.plannedDistanceMiles,
    estimatedTimeMin: trip.estimatedTimeMin,
    notes: trip.notes,
  };
}