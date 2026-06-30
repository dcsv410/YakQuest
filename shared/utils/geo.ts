import type { Coordinate } from "../models";
import { FEET_PER_MILE } from "../constants";

// const EARTH_RADIUS_FEET = 20902231;

// function toRadians(value: number) {
//   return (value * Math.PI) / 180;
// }

// export function distanceFeet(a: Coordinate, b: Coordinate) {
//   const dLat = toRadians(b.latitude - a.latitude);
//   const dLon = toRadians(b.longitude - a.longitude);

//   const lat1 = toRadians(a.latitude);
//   const lat2 = toRadians(b.latitude);

//   const h =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(lat1) *
//       Math.cos(lat2) *
//       Math.sin(dLon / 2) ** 2;

//   return 2 * EARTH_RADIUS_FEET * Math.asin(Math.sqrt(h));
// }

// export function feetToMiles(feet: number) {
//   return feet / FEET_PER_MILE;
// }

// export function findClosestIndex(
//   coordinates: Coordinate[],
//   point: Coordinate
// ) {
//   let bestIndex = 0;
//   let bestDistance = Infinity;

//   coordinates.forEach((coord, index) => {
//     const distance = distanceFeet(coord, point);

//     if (distance < bestDistance) {
//       bestDistance = distance;
//       bestIndex = index;
//     }
//   });

//   return bestIndex;
// }