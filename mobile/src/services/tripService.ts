import { River, RiverPoint } from "../../src/data/types";
import {
  buildTimeline,
  getRiverLengthMiles,
  getSegmentMiles,
  getTimeRange,
} from "../../src/features/trip-planning/utils/tripMath";

export const getRiverLength = (river: River | null): number => {
  if (!river) return 0;
  return getRiverLengthMiles(river);
};

export const getTripDistance = (
  river: River | null,
  start: RiverPoint | null,
  end: RiverPoint | null
): number => {
  if (!river || !start || !end) return 0;
  return getSegmentMiles(river, start, end);
};

export const getTripTimeRange = (miles: number) => {
  if (!miles) return null;
  return getTimeRange(miles);
};

export const getTripTimeline = (
  river: River | null,
  start: RiverPoint | null,
  end: RiverPoint | null,
  extraPoints: RiverPoint[] = []
) => {
  if (!river || !start || !end) return [];

  return buildTimeline(river, start, end, extraPoints);
};

export const getGoogleMapsUrl = (point: RiverPoint): string => {
  return `https://www.google.com/maps?q=${point.latitude},${point.longitude}`;
};