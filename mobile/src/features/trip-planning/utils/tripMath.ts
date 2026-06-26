import { Coordinate, River, RiverPoint } from "../../../data/types";
import {
  distanceFeet,
  feetToMiles,
  findClosestIndex,
} from "./geo";

export const getNearestRiver = (
  rivers: River[],
  location: Coordinate,
  maxDistanceFeet = 1500
): {
  river: River;
  distanceFeet: number;
  riverIndex: number;
} | null => {
  let best:
    | {
        river: River;
        distanceFeet: number;
        riverIndex: number;
      }
    | null = null;

  for (const river of rivers) {
    const index = findClosestIndex(
      river.coordinates,
      location
    );

    const point = river.coordinates[index];

    if (!point) continue;

    const dist = distanceFeet(location, point);

    if (best === null || dist < best.distanceFeet) {
      best = {
        river,
        distanceFeet: dist,
        riverIndex: index,
      };
    }
  }

  if (best === null) {
    return null;
  }

  if (best.distanceFeet > maxDistanceFeet) {
    return null;
  }

  return best;
};

export const getDistanceToRiverPointByPath = (
  river: River,
  location: Coordinate,
  point: RiverPoint
): number | null => {
  const currentIndex = findClosestIndex(river.coordinates, location);
  const pointIndex = findClosestIndex(river.coordinates, point);

  if (pointIndex < currentIndex) {
    return null;
  }

  return getPathDistanceFeetBetweenIndexes(
    river,
    currentIndex,
    pointIndex
  );
};

export const getNextPointDownstream = (
  river: River,
  location: Coordinate,
  extraPoints: RiverPoint[] = []
): {
  point: RiverPoint;
  distanceFeet: number;
} | null => {
  const currentIndex = findClosestIndex(river.coordinates, location);

  const points = [...getAllRiverPoints(river), ...extraPoints]
    .map((point) => ({
      point,
      index: findClosestIndex(river.coordinates, point),
    }))
    .filter((item) => item.index > currentIndex)
    .sort((a, b) => a.index - b.index);

  if (points.length === 0) return null;

  const next = points[0];

  return {
    point: next.point,
    distanceFeet: getPathDistanceFeetBetweenIndexes(
      river,
      currentIndex,
      next.index
    ),
  };
};

export const getSegmentBounds = (
  river: River,
  start: RiverPoint,
  end: RiverPoint
) => {
  const a = findClosestIndex(river.coordinates, start);
  const b = findClosestIndex(river.coordinates, end);

  return a < b ? [a, b] : [b, a];
};

export const getRiverLengthMiles = (river: River) => {
  let total = 0;

  for (let i = 1; i < river.coordinates.length; i++) {
    total += distanceFeet(
      river.coordinates[i - 1],
      river.coordinates[i]
    );
  }

  return feetToMiles(total);
};

export const getSegmentMiles = (
  river: River,
  start: RiverPoint,
  end: RiverPoint
) => {
  const coords = river.coordinates;
  const [s, e] = getSegmentBounds(river, start, end);

  let total = 0;

  for (let i = s + 1; i <= e; i++) {
    total += distanceFeet(coords[i - 1], coords[i]);
  }

  return feetToMiles(total);
};

export const getTimeRange = (miles: number) => {
  const fast = miles / 2.5;
  const slow = miles / 1.5;

  const roundHalf = (t: number) => Math.round(t * 2) / 2;

  return {
    min: roundHalf(fast),
    max: roundHalf(slow),
  };
};

export const getAllRiverPoints = (river: River) => {
  return [
    ...(river.accessPoints?.public || []),
    ...(river.accessPoints?.private || []),
    ...(river.pois || []),
  ];
};

export const getPathDistanceFeetBetweenIndexes = (
  river: River,
  startIndex: number,
  endIndex: number
) => {
  const coords = river.coordinates;
  const s = Math.min(startIndex, endIndex);
  const e = Math.max(startIndex, endIndex);

  let total = 0;

  for (let i = s + 1; i <= e; i++) {
    total += distanceFeet(coords[i - 1], coords[i]);
  }

  return total;
};

export const getRemainingRiverDistanceFeet = (
  river: River,
  location: Coordinate,
  end: Coordinate
) => {
  const currentIndex = findClosestIndex(river.coordinates, location);
  const endIndex = findClosestIndex(river.coordinates, end);

  return getPathDistanceFeetBetweenIndexes(
    river,
    currentIndex,
    endIndex
  );
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

  const miles = distanceFeet / 5280;
  const hours = elapsedMs / 1000 / 60 / 60;

  return miles / hours;
};

export const getEtaFromSpeed = (
  distanceFeet: number,
  averageSpeedMph: number
) => {
  if (averageSpeedMph <= 0) return null;

  const miles = distanceFeet / 5280;
  const hours = miles / averageSpeedMph;

  return hours * 60 * 60 * 1000;
};

export const getNextRiverPointByPath = (
  river: River,
  location: Coordinate,
  points: RiverPoint[]
): {
  point: RiverPoint;
  distanceFeet: number;
} | null => {
  const currentIndex = findClosestIndex(river.coordinates, location);

  const indexedPoints = points
    .map((point) => ({
      point,
      index: findClosestIndex(river.coordinates, point),
    }))
    .filter((item) => item.index >= currentIndex)
    .sort((a, b) => a.index - b.index);

  if (indexedPoints.length === 0) {
    return null;
  }

  const next = indexedPoints[0];

  return {
    point: next.point,
    distanceFeet: getPathDistanceFeetBetweenIndexes(
      river,
      currentIndex,
      next.index
    ),
  };
};

export const buildTimeline = (
  river: River,
  start: RiverPoint,
  end: RiverPoint,
  extraPoints: RiverPoint[] = []
) => {
  const coords = river.coordinates;
  const [s, e] = getSegmentBounds(river, start, end);

  const points = [
    ...getAllRiverPoints(river),
    ...extraPoints,
  ].map((p) => ({
    ...p,
    index: findClosestIndex(coords, p),
  }));

  const segmentPoints = points
    .filter((p) => p.index >= s && p.index <= e)
    .sort((a, b) => a.index - b.index);

  let cumulativeFeet = 0;
  const timeline: { name: string; miles: number }[] = [];

  for (let i = s + 1; i <= e; i++) {
    cumulativeFeet += distanceFeet(coords[i - 1], coords[i]);

    const miles = feetToMiles(cumulativeFeet);
    const matches = segmentPoints.filter((p) => p.index === i);

    matches.forEach((match) => {
      timeline.push({
        name: match.name,
        miles,
      });
    });
  }

  timeline.unshift({
    name: `${start.name} (Start)`,
    miles: 0,
  });

  timeline.push({
    name: `${end.name} (End)`,
    miles: feetToMiles(cumulativeFeet),
  });

  return timeline;
};