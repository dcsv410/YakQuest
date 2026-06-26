import { API_URL } from "../config";
import type { River } from "../types/river";

export async function fetchRivers(): Promise<River[]> {
  const response = await fetch(`${API_URL}/rivers`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch rivers: ${response.status} ${errorText}`
    );
  }

  return response.json();
}