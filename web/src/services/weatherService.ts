import type { RiverPoint } from "@yakquest/shared";

export type TripWeather = {
  forecastTime: string;
  temperatureF: number | null;
  windMph: number | null;
  rainChancePercent: number | null;
  weatherCode: number | null;
};

export async function fetchTripWeather(
  launch: RiverPoint,
  plannedLaunchDateTime: string
): Promise<TripWeather | null> {
  if (!plannedLaunchDateTime) return null;

  const launchDate = plannedLaunchDateTime.split("T")[0];

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${launch.latitude}` +
    `&longitude=${launch.longitude}` +
    `&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code` +
    `&temperature_unit=fahrenheit` +
    `&wind_speed_unit=mph` +
    `&timezone=auto` +
    `&start_date=${launchDate}` +
    `&end_date=${launchDate}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to load weather forecast");

  const data = await response.json();
  const times: string[] = data.hourly?.time ?? [];

  if (!times.length) return null;

  const target = new Date(plannedLaunchDateTime).getTime();

  let bestIndex = 0;
  let bestDiff = Infinity;

  times.forEach((time, index) => {
    const diff = Math.abs(new Date(time).getTime() - target);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = index;
    }
  });

  return {
    forecastTime: times[bestIndex],
    temperatureF: data.hourly.temperature_2m?.[bestIndex] ?? null,
    windMph: data.hourly.wind_speed_10m?.[bestIndex] ?? null,
    rainChancePercent:
      data.hourly.precipitation_probability?.[bestIndex] ?? null,
    weatherCode: data.hourly.weather_code?.[bestIndex] ?? null,
  };
}