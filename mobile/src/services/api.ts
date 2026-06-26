import { API_URL } from "../config";

export async function getRivers() {
  const response = await fetch(`${API_URL}/rivers`);

  if (!response.ok) {
    throw new Error("Failed to fetch rivers");
  }

  return response.json();
}