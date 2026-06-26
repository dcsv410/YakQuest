import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

const AUTH_TOKEN_KEY = "yakquest:authToken";

export type ApiCompletedTripPayload = {
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

export async function fetchCompletedTripsFromApi() {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/completed-trips`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function createCompletedTripInApi(
  payload: ApiCompletedTripPayload
) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/completed-trips`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function updateCompletedTripInApi(
  backendId: string,
  payload: {
    notes?: string | null;
  }
) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/completed-trips/${backendId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function deleteCompletedTripFromApi(backendId: string) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/completed-trips/${backendId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}