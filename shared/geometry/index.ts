import type { Coordinate } from "../models";
import { FEET_PER_MILE } from "../constants";

export const toRad = (value: number) => (value * Math.PI) / 180;

export const distanceFeet = (a: Coordinate, b: Coordinate) => {
  const earthRadiusMeters = 6371000;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMeters * centralAngle * 3.28084;
};

export const feetToMiles = (feet: number) => feet / FEET_PER_MILE;

export const distanceMiles = (a: Coordinate, b: Coordinate) =>
  feetToMiles(distanceFeet(a, b));

export const findClosestIndex = (
  coordinates: Coordinate[],
  point: Coordinate
) => {
  let bestIndex = 0;
  let bestDistance = Infinity;

  coordinates.forEach((coordinate, index) => {
    const distance = distanceFeet(coordinate, point);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
};

export const getPolylineDistanceFeet = (
  coordinates: Coordinate[],
  startIndex = 0,
  endIndex = coordinates.length - 1
) => {
  if (coordinates.length < 2) return 0;

  const start = Math.max(0, Math.min(startIndex, coordinates.length - 1));
  const end = Math.max(0, Math.min(endIndex, coordinates.length - 1));

  const low = Math.min(start, end);
  const high = Math.max(start, end);

  let total = 0;

  for (let index = low + 1; index <= high; index++) {
    total += distanceFeet(coordinates[index - 1], coordinates[index]);
  }

  return total;
};

export const getPolylineDistanceMiles = (
  coordinates: Coordinate[],
  startIndex = 0,
  endIndex = coordinates.length - 1
) => feetToMiles(getPolylineDistanceFeet(coordinates, startIndex, endIndex));

export const getCoordinateBounds = (coordinates: Coordinate[]) => {
  if (!coordinates.length) {
    return {
      latitude: 35.1,
      longitude: -86.5,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  coordinates.forEach((point) => {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  });

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.3, 0.01),
    longitudeDelta: Math.max((maxLng - minLng) * 1.3, 0.01),
  };
};