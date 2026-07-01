export const RIVER_POINT_ENUM = {
  PUBLIC_ACCESS: "public_access",
  PRIVATE_ACCESS: "private_access",
  POI: "poi",
  HAZARD: "hazard",
} as const;

export type RIVER_POINT_ENUM =
  (typeof RIVER_POINT_ENUM)[keyof typeof RIVER_POINT_ENUM];