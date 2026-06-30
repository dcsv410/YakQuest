import { Coordinate } from "../../../data/types";
import { FEET_PER_MILE } from "@yakquest/shared";

export const toRad = (x: number) => (x * Math.PI) / 180;

export const distanceFeet = (a: Coordinate, b: Coordinate) => {
  const R = 6371000;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c * 3.28084;
};

export const feetToMiles = (ft: number) => ft / FEET_PER_MILE;

export const findClosestIndex = (
  coords: Coordinate[],
  point: Coordinate
) => {
  let best = 0;
  let bestDist = Infinity;

  coords.forEach((c, i) => {
    const d = distanceFeet(c, point);

    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });

  return best;
};

export const getBounds = (river: { coordinates: Coordinate[] }) => {
  let minLat = 999;
  let maxLat = -999;
  let minLng = 999;
  let maxLng = -999;

  river.coordinates.forEach((p) => {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  });

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: (maxLat - minLat) * 1.3,
    longitudeDelta: (maxLng - minLng) * 1.3,
  };
};