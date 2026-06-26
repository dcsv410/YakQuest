import type { Coordinate, River, RiverPoint } from "@yakquest/shared";

const EARTH_RADIUS_FEET = 20902231;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceFeet(a: Coordinate, b: Coordinate) {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);

  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_FEET * Math.asin(Math.sqrt(h));
}

export function feetToMiles(feet: number) {
  return feet / 5280;
}

export function findClosestIndex(
  coordinates: Coordinate[],
  point: Coordinate
) {
  let bestIndex = 0;
  let bestDistance = Infinity;

  coordinates.forEach((coord, index) => {
    const d = distanceFeet(coord, point);

    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = index;
    }
  });

  return bestIndex;
}

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

function formatHours(hours: number) {
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