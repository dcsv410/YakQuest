import { River } from "../types";

import { alabamaRivers } from "./alabama/index";
import { tennesseeRivers } from "./tennessee/index";

type StateCode = string;

export const riversByState: Partial<Record<StateCode, River[]>> = {
  AL: alabamaRivers,
  TN: tennesseeRivers,
};

export const rivers: River[] = Object.values(riversByState)
  .flat()
  .filter((river): river is River => Boolean(river));

export const riverMap: Record<string, River> = Object.fromEntries(
  rivers.map((river) => [river.id, river])
);

export const getRiversForState = (state: StateCode): River[] => {
  return riversByState[state] ?? [];
};

export const getRiverById = (riverId: string): River | undefined => {
  return riverMap[riverId];
};