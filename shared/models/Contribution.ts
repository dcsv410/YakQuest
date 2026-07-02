import type { RiverPointType } from "./RiverPoint";

export type ContributionKind =
  | "new-river"
  | "existing-river-point"
  | "remove-existing-point"
  | "point-photo";

export type ContributionStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "failed";

export type ContributionPoint = {
  id?: string;
  name: string;
  type: RiverPointType;
  latitude: number;
  longitude: number;
  description?: string | null;
  parking?: boolean | null;
  restroom?: boolean | null;
  camping?: boolean | null;
  hazardType?: string | null;
  poiType?: string | null;
};

export type Contribution = {
  id: string;
  kind: ContributionKind;
  status: ContributionStatus;
  riverId?: string | null;
  riverName: string;
  state?: string | null;
  description?: string | null;
  points: ContributionPoint[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  trustedAutoApproved?: boolean;
  targetPointId?: string | null;
  targetPointName?: string | null;
  removalReason?: string | null;
  photoUri?: string | null;
  photoCaption?: string | null;
  backendId?: string | null;
};