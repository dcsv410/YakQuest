import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

const AUTH_TOKEN_KEY = "yakquest:authToken";

export type ApiSavedTripPayload = {
  riverId: string;
  name?: string | null;

  startName?: string | null;
  startLatitude: number;
  startLongitude: number;

  endName?: string | null;
  endLatitude: number;
  endLongitude: number;

  plannedDistanceMiles?: number | null;
  estimatedTimeMin?: number | null;

  notes?: string | null;
};

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    throw new Error("User is not logged in");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchSavedTripsFromApi() {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/trips`, {
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch saved trips: ${errorText}`);
  }

  return response.json();
}

export async function createSavedTripInApi(payload: ApiSavedTripPayload) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/trips`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create saved trip: ${errorText}`);
  }

  return response.json();
}

export async function updateSavedTripInApi(
  backendId: string,
  payload: {
    name?: string | null;
    notes?: string | null;
  }
) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/trips/${backendId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update saved trip: ${errorText}`);
  }

  return response.json();
}

export async function deleteSavedTripFromApi(backendId: string) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/trips/${backendId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete saved trip: ${errorText}`);
  }

  return response.json();
}