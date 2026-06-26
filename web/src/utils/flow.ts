import type { FlowStats } from "../types/river";

export async function fetchUSGSFlow(
  gaugeId: string
): Promise<number | null> {
  const url =
    `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${gaugeId}&parameterCd=00060&siteStatus=all`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const value =
      data?.value?.timeSeries?.[0]?.values?.[0]?.value?.[0]?.value;

    if (value === undefined || value === null) {
      return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

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

export function getFlowRating(percentile: number | null) {
  if (percentile === null) return "Unknown";
  if (percentile < 20) return "Low";
  if (percentile < 75) return "Ideal";
  if (percentile < 95) return "High";
  return "Dangerous";
}