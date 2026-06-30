import { River, RiverPoint } from "../../src/data/types";
import { getBounds } from "../../src/features/trip-planning/utils/geo";
import { getAllRiverPoints } from "@yakquest/shared";

export const getRiverMapBounds = (river: River) => {
  return getBounds(river);
};

export const getRiverMapPoints = (river: River | null): RiverPoint[] => {
  if (!river) return [];
  return getAllRiverPoints(river);
};