import { rivers, riverMap, riversByState } from "../../src/data/rivers";
import { River } from "../../src/data/types";
import { fetchRivers } from "./apiRiverService";
import { saveRiversToCache, getCachedRivers } from "./riverCacheService";
import { API_URL } from "../config";

const USE_BACKEND_RIVERS = true;
type StateCode = string;

async function fetchWithTimeout(url: string, timeoutMs = 4000) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getAllRivers(): Promise<River[]> {
  try {
    const response = await fetchWithTimeout(`${API_URL}/rivers`);

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const rivers = await response.json();

    await saveRiversToCache(rivers);

    return rivers;
  } catch (error) {
    console.warn("Backend unavailable. Loading cached rivers.", error);

    const cachedRivers = await getCachedRivers();

    if (cachedRivers.length) {
      return cachedRivers;
    }

    throw error;
  }
}

export const getRiverById = (riverId: string): River | undefined => {
  return riverMap[riverId];
};

export const getRiversByState = (state: StateCode): River[] => {
  return riversByState[state] ?? [];
};

export const searchRivers = (query: string): River[] => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return rivers;
  }

  return rivers.filter((river) => {
    return (
      river.name.toLowerCase().includes(normalizedQuery) ||
      (river.stateName ?? "").toLowerCase().includes(normalizedQuery) ||
      (river.state ?? "").toLowerCase().includes(normalizedQuery) ||
      (river.slug ?? "").toLowerCase().includes(normalizedQuery)
    );
  });
};

export const getRiverDisplayName = (river: River): string => {
  return `${river.name}, ${river.state}`;
};