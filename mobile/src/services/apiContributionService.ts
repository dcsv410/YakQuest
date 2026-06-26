import { API_URL } from "../config";

export async function submitContribution(payload: any) {
  const response = await fetch(`${API_URL}/contributions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit contribution: ${errorText}`);
  }

  return response.json();
}