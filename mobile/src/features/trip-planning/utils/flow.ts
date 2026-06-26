import { FlowStats } from "../../../data/types";

export const fetchUSGSFlow = async (siteId: string) => {
  const url =
    `https://waterservices.usgs.gov/nwis/iv/?format=json` +
    `&sites=${siteId}&parameterCd=00060`;

  const res = await fetch(url);
  const json = await res.json();

  const value =
    json?.value?.timeSeries?.[0]?.values?.[0]?.value?.[0]?.value;

  return value ? Number(value) : null;
};

export const getFlowPercentile = (
  cfs: number | null,
  stats?: FlowStats
) => {
  if (!cfs || !stats) return null;

  if (cfs <= stats.lowPercentile) return 0.1;
  if (cfs <= stats.median) return 0.5;
  if (cfs <= stats.highPercentile) return 0.75;
  if (cfs <= stats.max) return 0.9;

  return 1.0;
};

export const getFlowRating = (p: number | null) => {
  if (p == null) return "Unknown";

  if (p < 0.15) return "Very Low";
  if (p < 0.4) return "Low";
  if (p < 0.7) return "Ideal";
  if (p < 0.85) return "High";
  if (p < 0.95) return "Very High";

  return "Dangerous";
};

export const getSafetyWarnings = (
  flowRating: string,
  difficulty?: number
) => {
  const warnings: string[] = [];

  if (flowRating === "Very High") {
    warnings.push("River is running higher than normal.");
  }

  if (flowRating === "Dangerous") {
    warnings.push("Dangerous flow conditions.");
  }

  if ((difficulty ?? 0) >= 4) {
    warnings.push("Advanced paddling skills recommended.");
  }

  return warnings;
};