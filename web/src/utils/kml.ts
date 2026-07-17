import type { Coordinate } from "@yakquest/shared";

function parseCoordinateText(raw: string): Coordinate[] {
  return raw
    .trim()
    .split(/\s+/)
    .map((chunk) => {
      const parts = chunk.split(",");

      const longitude = Number(parts[0]);
      const latitude = Number(parts[1]);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      if (latitude < -90 || latitude > 90) {
        return null;
      }

      if (longitude < -180 || longitude > 180) {
        return null;
      }

      return {
        latitude,
        longitude,
      };
    })
    .filter((coordinate): coordinate is Coordinate => coordinate !== null);
}

export function parseKmlCoordinates(kmlText: string): Coordinate[] {
  const parser = new DOMParser();
  const document = parser.parseFromString(
    kmlText,
    "application/xml"
  );

  const parserError = document.querySelector("parsererror");

  if (parserError) {
    throw new Error("The selected file is not valid XML/KML.");
  }

  const lineStrings = Array.from(
    document.getElementsByTagName("LineString")
  );

  const routes = lineStrings
    .map((lineString) => {
      const coordinatesNode =
        lineString.getElementsByTagName("coordinates")[0];

      if (!coordinatesNode) {
        return [];
      }

      return parseCoordinateText(coordinatesNode.textContent ?? "");
    })
    .filter((route) => route.length >= 2);

  if (!routes.length) {
    throw new Error(
      "No valid LineString route was found in this KML file."
    );
  }

  /*
   * Some KML files contain several LineStrings, including short decorative
   * lines. Use the route containing the most coordinates.
   */
  return routes.reduce((longest, current) =>
    current.length > longest.length ? current : longest
  );
}