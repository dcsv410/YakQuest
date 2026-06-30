export {
  distanceFeet,
  distanceMiles,
  feetToMiles,
  findClosestIndex,
  getCoordinateBounds,
  getPolylineDistanceFeet,
  getPolylineDistanceMiles,
  toRad,
} from "@yakquest/shared";

import type { Coordinate } from "@yakquest/shared";
import { getCoordinateBounds } from "@yakquest/shared";

export const getBounds = (river: { coordinates: Coordinate[] }) =>
  getCoordinateBounds(river.coordinates);