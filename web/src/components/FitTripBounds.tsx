import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { River, RiverPoint } from "@yakquest/shared";
import { findClosestIndex } from "../utils/tripMath";

type Props = {
  river: River;
  start: RiverPoint;
  end: RiverPoint;
};

export default function FitTripBounds({ river, start, end }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!river.coordinates.length) return;

    const startIndex = findClosestIndex(river.coordinates, start);
    const endIndex = findClosestIndex(river.coordinates, end);

    const from = Math.min(startIndex, endIndex);
    const to = Math.max(startIndex, endIndex);

    const segment = river.coordinates.slice(from, to + 1);

    const bounds = L.latLngBounds(
      segment.map((coord) => [
        coord.latitude,
        coord.longitude,
      ])
    );

    map.fitBounds(bounds, {
      padding: [70, 70],
      maxZoom: 14,
    });
  }, [river, start, end, map]);

  return null;
}