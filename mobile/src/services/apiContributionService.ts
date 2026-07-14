import { API_URL } from "../config";
import { getToken } from "./authService";

export async function submitContribution(
  payload: unknown
) {
  const token = await getToken();

  if (!token) {
    throw new Error(
      "You must be signed in to submit a contribution."
    );
  }

  const response = await fetch(
    `${API_URL}/contributions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Failed to submit contribution: ${errorText}`
    );
  }

  return response.json();
}