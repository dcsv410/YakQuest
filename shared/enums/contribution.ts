export const CONTRIBUTION_STATUS_ENUM = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  FAILED: "failed",
} as const;

export type CONTRIBUTION_STATUS_ENUM =
  (typeof CONTRIBUTION_STATUS_ENUM)[keyof typeof CONTRIBUTION_STATUS_ENUM];

export const CONTRIBUTION_KIND_ENUM = {
  NEWRIVER: "new-river",
  EXISTINGRIVERPOINT: "existing-river-point",
  REMOVEEXISTINGPOINT: "remove-existing-point",
  POINTPHOTO: "point-photo",
} as const;

export type CONTRIBUTION_KIND_ENUM = 
  (typeof CONTRIBUTION_KIND_ENUM)[keyof typeof CONTRIBUTION_KIND_ENUM];