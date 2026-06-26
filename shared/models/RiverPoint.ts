import type { Coordinate } from "./Coordinate";

export type RiverPointType =
  | "public_access"
  | "private_access"
  | "poi"
  | "hazard";

export type RiverPoint = Coordinate & {
  id: string;
  name: string;
  type: RiverPointType;

  description?: string | null;

  parking?: boolean | null;
  restroom?: boolean | null;
  camping?: boolean | null;

  photos?: string[];
  website?: string | null;
  phone?: string | null;

  hazardType?: string | null;
  poiType?: string | null;
};