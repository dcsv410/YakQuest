export const FLOW_RATING_ENUM = {
  UNKNOWN: "Unknown",
  LOW: "Low",
  IDEAL: "Ideal",
  HIGH: "High",
  DANGEROUS: "Dangerous",
} as const;

export type FLOW_RATING_ENUM =
  (typeof FLOW_RATING_ENUM)[keyof typeof FLOW_RATING_ENUM];