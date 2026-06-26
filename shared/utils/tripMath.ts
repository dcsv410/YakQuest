import type { Coordinate, River, RiverPoint } from "../models";
import {
  distanceFeet,
  feetToMiles,
  findClosestIndex,
} from "./geo";

export function getTripDistanceMiles(
  river: River,
  start: RiverPoint,
  end: RiverPoint
) {
  if (!river.coordinates.length) return 0;

  const startIndex = findClosestIndex(river.coordinates, start);
  const endIndex = findClosestIndex(river.coordinates, end);

  const from = Math.min(startIndex, endIndex);
  const to = Math.max(startIndex, endIndex);

  let totalFeet = 0;

  for (let i = from; i < to; i++) {
    totalFeet += distanceFeet(river.coordinates[i], river.coordinates[i + 1]);
  }

  return feetToMiles(totalFeet);
}

export function getTripTimeRange(distanceMiles: number) {
  const fastMph = 2.5;
  const slowMph = 1.5;

  const fastHours = distanceMiles / fastMph;
  const slowHours = distanceMiles / slowMph;

  return {
    fastHours,
    slowHours,
    label: `${formatHours(fastHours)} – ${formatHours(slowHours)}`,
  };
}

export function formatHours(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "0 hrs";
  }

  const rounded = Math.round(hours * 2) / 2;

  if (rounded < 1) {
    return "0.5 hrs";
  }

  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} hrs`;
}

export function getDistanceMilesAlongRiver(
  river: River,
  start: RiverPoint,
  point: RiverPoint
) {
  if (!river.coordinates.length) return 0;

  const startIndex = findClosestIndex(river.coordinates, start);
  const pointIndex = findClosestIndex(river.coordinates, point);

  const from = Math.min(startIndex, pointIndex);
  const to = Math.max(startIndex, pointIndex);

  let totalFeet = 0;

  for (let i = from; i < to; i++) {
    totalFeet += distanceFeet(river.coordinates[i], river.coordinates[i + 1]);
  }

  return feetToMiles(totalFeet);
}

export function getTripTimelinePoints(
  river: River,
  start: RiverPoint,
  end: RiverPoint
) {
  const startIndex = findClosestIndex(river.coordinates, start);
  const endIndex = findClosestIndex(river.coordinates, end);

  const minIndex = Math.min(startIndex, endIndex);
  const maxIndex = Math.max(startIndex, endIndex);

  const allPoints = [
    start,
    ...river.accessPoints.public,
    ...river.accessPoints.private,
    ...river.pois,
    ...(river.hazards ?? []),
    end,
  ];

  const uniquePoints = new Map<string, RiverPoint>();

  for (const point of allPoints) {
    uniquePoints.set(point.id, point);
  }

  return Array.from(uniquePoints.values())
    .filter((point) => {
      const index = findClosestIndex(river.coordinates, point);
      return index >= minIndex && index <= maxIndex;
    })
    .map((point) => ({
      point,
      distanceMiles: getDistanceMilesAlongRiver(river, start, point),
      type:
        point.id === start.id
          ? "Launch"
          : point.id === end.id
          ? "Takeout"
          : point.type,
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}

export function getTripSegmentCoordinates(
  river: River,
  start: RiverPoint,
  end: RiverPoint
): Coordinate[] {
  if (!river.coordinates.length) return [];

  const startIndex = findClosestIndex(river.coordinates, start);
  const endIndex = findClosestIndex(river.coordinates, end);

  const from = Math.min(startIndex, endIndex);
  const to = Math.max(startIndex, endIndex);

  return river.coordinates.slice(from, to + 1);
}