import type { FlowStats } from "../models";

export type FlowRating =
  | "Unknown"
  | "Low"
  | "Ideal"
  | "High"
  | "Dangerous";

export function getFlowPercentile(
  flowCfs: number,
  stats: FlowStats
): number {
  if (flowCfs <= stats.lowPercentile) return 10;
  if (flowCfs <= stats.median) return 40;
  if (flowCfs <= stats.highPercentile) return 70;
  if (flowCfs <= stats.max) return 90;

  return 99;
}

export function getFlowRating(
  percentile: number | null
): FlowRating {
  if (percentile === null) return "Unknown";
  if (percentile < 20) return "Low";
  if (percentile < 75) return "Ideal";
  if (percentile < 95) return "High";

  return "Dangerous";
}

export function getSafetyWarnings(
  flowRating: FlowRating,
  difficulty?: number | null
): string[] {
  const warnings: string[] = [];

  if (flowRating === "High") {
    warnings.push(
      "Water is running high. Expect faster current and fewer recovery options."
    );
  }

  if (flowRating === "Dangerous") {
    warnings.push(
      "Dangerous flow conditions. Consider postponing this trip."
    );
  }

  if (flowRating === "Low") {
    warnings.push(
      "Water may be low. Expect dragging, shallow spots, and slower travel."
    );
  }

  if (difficulty && difficulty >= 4) {
    warnings.push(
      "This river has higher difficulty. Paddle within your skill level."
    );
  }

  return warnings;
}