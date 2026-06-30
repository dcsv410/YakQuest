import type { Outfitter } from "../models";

export type OutfitterResponseDTO = Outfitter;

export type CreateOutfitterRequestDTO = {
  riverId: string;
  name: string;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  highestPutInPointId?: string | null;
  lowestTakeOutPointId?: string | null;
  accessPointIds: string[];
};

export type UpdateOutfitterRequestDTO =
  Partial<Omit<CreateOutfitterRequestDTO, "riverId">> & {
    isActive?: boolean;
  };