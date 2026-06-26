import { rivers, riverMap, riversByState } from "../../src/data/rivers";
import { River, StateCode } from "../../src/data/types";
import { fetchRivers } from "./apiRiverService";

const USE_BACKEND_RIVERS = true;

export const getAllRivers = async (): Promise<River[]> => {
  if (USE_BACKEND_RIVERS) {
    return fetchRivers();
  }

  return rivers;
};

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
      river.stateName.toLowerCase().includes(normalizedQuery) ||
      river.state.toLowerCase().includes(normalizedQuery) ||
      river.slug.toLowerCase().includes(normalizedQuery)
    );
  });
};

export const getRiverDisplayName = (river: River): string => {
  return `${river.name}, ${river.state}`;
};