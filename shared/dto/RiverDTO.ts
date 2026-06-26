import type { FlowStats, River } from "../models";

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