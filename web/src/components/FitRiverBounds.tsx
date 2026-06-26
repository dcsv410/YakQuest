import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Coordinate } from "../types/river";

type Props = {
  coordinates: Coordinate[];
};

export default function FitRiverBounds({ coordinates }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!coordinates.length) return;

    const bounds = L.latLngBounds(
      coordinates.map((coord) => [
        coord.latitude,
        coord.longitude,
      ])
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 14,
    });
  }, [coordinates, map]);

  return null;
}