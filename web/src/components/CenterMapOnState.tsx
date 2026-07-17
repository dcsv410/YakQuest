import { useEffect } from "react";
import { useMap } from "react-leaflet";

type StateCenter = {
  center: [number, number];
  zoom: number;
};

const STATE_MAP_SETTINGS: Record<string, StateCenter> = {
  AL: {
    center: [32.8067, -86.7911],
    zoom: 7,
  },
  AK: {
    center: [64.2008, -152.4937],
    zoom: 4,
  },
  AZ: {
    center: [34.0489, -111.0937],
    zoom: 7,
  },
  AR: {
    center: [35.2011, -91.8318],
    zoom: 7,
  },
  CA: {
    center: [36.7783, -119.4179],
    zoom: 6,
  },
  CO: {
    center: [39.5501, -105.7821],
    zoom: 7,
  },
  CT: {
    center: [41.6032, -73.0877],
    zoom: 9,
  },
  DE: {
    center: [38.9108, -75.5277],
    zoom: 9,
  },
  FL: {
    center: [27.6648, -81.5158],
    zoom: 6,
  },
  GA: {
    center: [32.1656, -82.9001],
    zoom: 7,
  },
  HI: {
    center: [19.8968, -155.5828],
    zoom: 7,
  },
  ID: {
    center: [44.0682, -114.742],
    zoom: 6,
  },
  IL: {
    center: [40.6331, -89.3985],
    zoom: 7,
  },
  IN: {
    center: [40.2672, -86.1349],
    zoom: 7,
  },
  IA: {
    center: [41.878, -93.0977],
    zoom: 7,
  },
  KS: {
    center: [39.0119, -98.4842],
    zoom: 7,
  },
  KY: {
    center: [37.8393, -84.27],
    zoom: 7,
  },
  LA: {
    center: [30.9843, -91.9623],
    zoom: 7,
  },
  ME: {
    center: [45.2538, -69.4455],
    zoom: 7,
  },
  MD: {
    center: [39.0458, -76.6413],
    zoom: 8,
  },
  MA: {
    center: [42.4072, -71.3824],
    zoom: 8,
  },
  MI: {
    center: [44.3148, -85.6024],
    zoom: 6,
  },
  MN: {
    center: [46.7296, -94.6859],
    zoom: 6,
  },
  MS: {
    center: [32.3547, -89.3985],
    zoom: 7,
  },
  MO: {
    center: [37.9643, -91.8318],
    zoom: 7,
  },
  MT: {
    center: [46.8797, -110.3626],
    zoom: 6,
  },
  NE: {
    center: [41.4925, -99.9018],
    zoom: 7,
  },
  NV: {
    center: [38.8026, -116.4194],
    zoom: 6,
  },
  NH: {
    center: [43.1939, -71.5724],
    zoom: 8,
  },
  NJ: {
    center: [40.0583, -74.4057],
    zoom: 8,
  },
  NM: {
    center: [34.5199, -105.8701],
    zoom: 7,
  },
  NY: {
    center: [43.2994, -74.2179],
    zoom: 7,
  },
  NC: {
    center: [35.7596, -79.0193],
    zoom: 7,
  },
  ND: {
    center: [47.5515, -101.002],
    zoom: 7,
  },
  OH: {
    center: [40.4173, -82.9071],
    zoom: 7,
  },
  OK: {
    center: [35.4676, -97.5164],
    zoom: 7,
  },
  OR: {
    center: [43.8041, -120.5542],
    zoom: 6,
  },
  PA: {
    center: [41.2033, -77.1945],
    zoom: 7,
  },
  RI: {
    center: [41.5801, -71.4774],
    zoom: 9,
  },
  SC: {
    center: [33.8361, -80.8987],
    zoom: 7,
  },
  SD: {
    center: [43.9695, -99.9018],
    zoom: 7,
  },
  TN: {
    center: [35.5175, -86.5804],
    zoom: 7,
  },
  TX: {
    center: [31.9686, -99.9018],
    zoom: 6,
  },
  UT: {
    center: [39.321, -111.0937],
    zoom: 7,
  },
  VT: {
    center: [44.5588, -72.5778],
    zoom: 8,
  },
  VA: {
    center: [37.4316, -78.6569],
    zoom: 7,
  },
  WA: {
    center: [47.4009, -120.7401],
    zoom: 7,
  },
  WV: {
    center: [38.5976, -80.4549],
    zoom: 7,
  },
  WI: {
    center: [43.7844, -88.7879],
    zoom: 7,
  },
  WY: {
    center: [43.076, -107.2903],
    zoom: 7,
  },
};

type CenterMapOnStateProps = {
  state: string;
  enabled?: boolean;
};

export default function CenterMapOnState({
  state,
  enabled = true,
}: CenterMapOnStateProps) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;

    const settings = STATE_MAP_SETTINGS[state];

    if (!settings) return;

    map.setView(settings.center, settings.zoom, {
      animate: true,
    });
  }, [enabled, map, state]);

  return null;
}