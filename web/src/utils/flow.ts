export {
  getFlowPercentile,
  getFlowRating,
  getSafetyWarnings,
} from "@yakquest/shared";

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