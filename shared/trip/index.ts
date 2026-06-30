import type { River } from "../models";
import {
  FAST_PADDLING_MPH,
  SLOW_PADDLING_MPH,
  FEET_PER_MILE,
} from "../constants";

export type TripTimeRange = {
  min: number;
  max: number;
};

export const getTimeRange = (
  miles: number,
  fastMph = FAST_PADDLING_MPH,
  slowMph = SLOW_PADDLING_MPH
): TripTimeRange => {
  const fast = miles / fastMph;
  const slow = miles / slowMph;

  const roundHalf = (time: number) => Math.round(time * 2) / 2;

  return {
    min: roundHalf(fast),
    max: roundHalf(slow),
  };
};

export const formatDuration = (ms: number) => {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes} min`;

  return `${hours} hr ${minutes} min`;
};

export const getAverageSpeedMph = (
  distanceFeet: number,
  elapsedMs: number
) => {
  if (elapsedMs <= 0) return 0;

  const miles = distanceFeet / FEET_PER_MILE;
  const hours = elapsedMs / 1000 / 60 / 60;

  return miles / hours;
};

export const getEtaFromSpeed = (
  distanceFeet: number,
  averageSpeedMph: number
) => {
  if (averageSpeedMph <= 0) return null;

  const miles = distanceFeet / FEET_PER_MILE;
  const hours = miles / averageSpeedMph;

  return hours * 60 * 60 * 1000;
};

export const getAllRiverPoints = (river: River) => {
  return [
    ...(river.accessPoints?.public || []),
    ...(river.accessPoints?.private || []),
    ...(river.pois || []),
    ...(river.hazards || []),
  ];
};