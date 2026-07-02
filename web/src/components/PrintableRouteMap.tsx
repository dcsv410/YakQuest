import type { Coordinate, River, RiverPoint } from "@yakquest/shared";
import { getTripSegmentCoordinates, getTripTimelinePoints } from "@yakquest/shared";

type Props = {
  river: River;
  start: RiverPoint;
  end: RiverPoint;
};

function projectPoint(
  point: Coordinate,
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  },
  width: number,
  height: number
) {
  const lngRange = bounds.maxLng - bounds.minLng || 1;
  const latRange = bounds.maxLat - bounds.minLat || 1;

  const shouldRotate = lngRange > latRange;

  if (shouldRotate) {
    const x = ((point.latitude - bounds.minLat) / latRange) * width;
    const y = height - ((point.longitude - bounds.minLng) / lngRange) * height;

    return { x, y };
  }

  const x = ((point.longitude - bounds.minLng) / lngRange) * width;
  const y = height - ((point.latitude - bounds.minLat) / latRange) * height;

  return { x, y };
}

export default function PrintableRouteMap({ river, start, end }: Props) {
  const width = 360;
  const height = 760;
  const padding = 30;

  const routePoints = getTripSegmentCoordinates(river, start, end);
  const timelinePoints = getTripTimelinePoints(river, start, end);

  const routeMarkers = timelinePoints.map((item) => item.point);

  const allCoords = [
    ...routePoints,
    start,
    end,
    ...routeMarkers,
  ];

  const bounds = {
    minLat: Math.min(...allCoords.map((p) => p.latitude)),
    maxLat: Math.max(...allCoords.map((p) => p.latitude)),
    minLng: Math.min(...allCoords.map((p) => p.longitude)),
    maxLng: Math.max(...allCoords.map((p) => p.longitude)),
  };

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const routePath = routePoints
    .map((coord) => {
      const p = projectPoint(coord, bounds, innerWidth, innerHeight);
      return `${p.x + padding},${p.y + padding}`;
    })
    .join(" ");

  const renderMarker = (
    point: RiverPoint,
    label: string,
    className: string
  ) => {
    const p = projectPoint(point, bounds, innerWidth, innerHeight);

    return (
      <g key={`${className}-${point.id}`}>
        <circle
          cx={p.x + padding}
          cy={p.y + padding}
          r="7"
          className={className}
        />
        <text
          x={p.x + padding + 10}
          y={p.y + padding - 8}
          className="print-map-label"
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="print-map-wrapper">
      <h3>Route Map</h3>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="print-route-map"
        role="img"
      >
        <rect width={width} height={height} rx="18" className="print-map-bg" />

        <polyline points={routePath} className="print-route-line" />

        {routeMarkers
          .filter((point) => point.id !== start.id && point.id !== end.id)
          .map((point) =>
            renderMarker(
              point,
              point.name,
              point.type === "hazard"
                ? "print-marker-hazard"
                : "print-marker-poi"
            )
          )}

        {renderMarker(start, "Launch", "print-marker-start")}
        {renderMarker(end, "Takeout", "print-marker-end")}
      </svg>
    </div>
  );
}