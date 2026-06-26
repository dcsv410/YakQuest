import { River, StateCode } from "../types";

import { alabamaRivers } from "./alabama/index";
import { tennesseeRivers } from "./tennessee/index";

export const riversByState: Partial<Record<StateCode, River[]>> = {
  AL: alabamaRivers,
  TN: tennesseeRivers,
};

export const rivers: River[] = Object.values(riversByState).flat();

export const riverMap: Record<string, River> = Object.fromEntries(
  rivers.map((river) => [river.id, river])
);

export const getRiversForState = (state: StateCode): River[] => {
  return riversByState[state] ?? [];
};

export const getRiverById = (riverId: string): River | undefined => {
  return riverMap[riverId];
};