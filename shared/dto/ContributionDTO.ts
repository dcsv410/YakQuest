import type { Coordinate, RiverPointType } from "../models";

export type ContributionStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "failed";

export type ContributionKind =
  | "new-river"
  | "existing-river-point"
  | "remove-existing-point";

export type ContributionPointDTO = Coordinate & {
  id?: string;
  name: string;
  type: RiverPointType;
  description?: string | null;
  parking?: boolean | null;
  restroom?: boolean | null;
  camping?: boolean | null;
  hazardType?: string | null;
  poiType?: string | null;
};

export type ContributionResponseDTO = {
  id: string;
  kind: ContributionKind;
  status: ContributionStatus;

  river_id?: string | null;
  river_name: string;
  state?: string | null;

  points: ContributionPointDTO[];

  target_point_id?: string | null;
  target_point_name?: string | null;
  removal_reason?: string | null;

  review_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;

  created_at: string;
  updated_at?: string | null;
};

export type CreateContributionRequestDTO = {
  kind: ContributionKind;

  riverId?: string | null;
  riverName: string;
  state?: string | null;

  points: ContributionPointDTO[];

  targetPointId?: string | null;
  targetPointName?: string | null;
  removalReason?: string | null;
};

export type ReviewContributionRequestDTO = {
  status: "approved" | "rejected";
  reviewNotes?: string | null;
};