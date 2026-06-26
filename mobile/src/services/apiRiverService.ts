import { River } from "../data/types";
import { API_URL } from "../config";

export async function fetchRivers(): Promise<River[]> {
  const response = await fetch(`${API_URL}/rivers`);

  if (!response.ok) {
    throw new Error("Failed to load rivers");
  }

  return response.json();
}