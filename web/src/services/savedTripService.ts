import { API_URL } from "../config";
import { getToken } from "./authService";
import type { SavedTrip } from "@yakquest/shared";

type ApiSavedTrip = {
  id: string;

  river_id: string;
  name: string;

  start_name: string;
  start_latitude: number;
  start_longitude: number;

  end_name: string;
  end_latitude: number;
  end_longitude: number;

  planned_distance_miles: number;
  estimated_time_min?: number;

  notes?: string;

  created_at: string;
  updated_at?: string;
};

function fromApiSavedTrip(api: ApiSavedTrip): SavedTrip {
  return {
    id: api.id,

    riverId: api.river_id,

    name: api.name,

    startName: api.start_name,
    endName: api.end_name,

    startLatitude: api.start_latitude,
    startLongitude: api.start_longitude,

    endLatitude: api.end_latitude,
    endLongitude: api.end_longitude,

    plannedDistanceMiles: api.planned_distance_miles,
    estimatedTimeMin: api.estimated_time_min,

    notes: api.notes,

    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

function toApiSavedTrip(trip: Partial<SavedTrip>) {
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

function authHeaders() {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchSavedTrips(): Promise<SavedTrip[]> {
  const response = await fetch(`${API_URL}/trips`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const apiTrips: ApiSavedTrip[] = await response.json();

    return apiTrips.map(fromApiSavedTrip);
}

export async function createSavedTrip(
  trip: Omit<SavedTrip, "id" | "createdAt" | "updatedAt">
) {
  const response = await fetch(`${API_URL}/trips`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(toApiSavedTrip(trip)),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function updateSavedTrip(
  id: string,
  patch: Partial<SavedTrip>
) {
  const response = await fetch(`${API_URL}/trips/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(toApiSavedTrip(patch)),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function deleteSavedTrip(id: string) {
  const response = await fetch(`${API_URL}/trips/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}