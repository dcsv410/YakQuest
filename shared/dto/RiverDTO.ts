import type { FlowStats, River, RiverPoint, RiverPointType, Coordinate } from "../models";

export type RiverResponseDTO = River;

export type UpdateRiverRequestDTO = {
  name?: string;
  state?: string;
  difficulty?: number;
  cleanliness?: number;
  fishing?: number;
  usgsGaugeId?: string | null;
  flowStats?: FlowStats | null;
};

export type UpdateRiverPointRequestDTO = {
  name?: string;
  type?: RiverPointType;
  description?: string | null;
  latitude?: number;
  longitude?: number;
  parking?: boolean | null;
  restroom?: boolean | null;
  camping?: boolean | null;
  website?: string | null;
  phone?: string | null;
  isActive?: boolean;
};

export type RiverPointResponseDTO = RiverPoint & {
  isActive?: boolean;
};

export type CreateRiverPointRequestDTO = {
  name: string;
  type: RiverPointType;
  latitude: number;
  longitude: number;

  description?: string | null;

  parking?: boolean | null;
  restroom?: boolean | null;
  camping?: boolean | null;
};

export type CreateRiverRequestDTO = {
  name: string;
  state: string;
  difficulty: number;
  cleanliness: number;
  fishing: number;
  usgsGaugeId?: string | null;
  flowStats?: FlowStats | null;
  coordinates: Coordinate[];
};