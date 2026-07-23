import { API_URL } from "../config";
import { getToken } from "./authService";

import type {
  TripParticipant,
  TripParticipantQrToken,
} from "../features/trip-participants/types";

async function readApiError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await response.json();

    if (
      data &&
      typeof data.detail === "string"
    ) {
      return data.detail;
    }
  } catch {
    // Use fallback.
  }

  return fallback;
}

async function getAuthHeaders() {
  const token = await getToken();

  if (!token) {
    throw new Error(
      "You must be logged in to use trip QR codes."
    );
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function createTripQrToken():
Promise<TripParticipantQrToken> {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/trip-participants/qr-token`,
    {
      method: "POST",
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        "Unable to create your trip QR code."
      )
    );
  }

  return response.json();
}

export async function resolveTripQrToken(
  token: string
): Promise<TripParticipant> {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/trip-participants/resolve`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        token,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        "Unable to verify this paddler."
      )
    );
  }

  return response.json();
}