import { useEffect, useRef } from "react";
import type { Coordinate, River, RiverPoint } from "@yakquest/shared";
import {
  getTripSegmentCoordinates,
  getTripTimelinePoints,
} from "@yakquest/shared";

type Props = {
  river: River;
  start: RiverPoint;
  end: RiverPoint;
};

type Bounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

function projectPoint(
  point: Coordinate,
  bounds: Bounds,
  width: number,
  height: number
) {
  const lngRange = bounds.maxLng - bounds.minLng || 1;
  const latRange = bounds.maxLat - bounds.minLat || 1;

  // If the route is wider east/west than north/south,
  // rotate the projection so the longest direction runs vertically.
  const shouldRotate = lngRange > latRange;

  if (shouldRotate) {
    const x = ((point.latitude - bounds.minLat) / latRange) * width;
    const y =
      height - ((point.longitude - bounds.minLng) / lngRange) * height;

    return { x, y };
  }

  const x = ((point.longitude - bounds.minLng) / lngRange) * width;
  const y = height - ((point.latitude - bounds.minLat) / latRange) * height;

  return { x, y };
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color: string
) {
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "white";
  ctx.stroke();

  ctx.font = "700 12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "#10201c";

  const labelX = x + 11;
  const labelY = y - 8;

  ctx.fillText(label, labelX, labelY);
}

export default function PrintableRouteMap({ river, start, end }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 360;
    const height = 760;
    const padding = 30;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const routePoints = getTripSegmentCoordinates(river, start, end);
    const timelinePoints = getTripTimelinePoints(river, start, end);
    const routeMarkers = timelinePoints.map((item) => item.point);

    const allCoords = [
      ...routePoints,
      start,
      end,
      ...routeMarkers,
    ];

    if (!allCoords.length) return;

    const bounds = {
      minLat: Math.min(...allCoords.map((p) => p.latitude)),
      maxLat: Math.max(...allCoords.map((p) => p.latitude)),
      minLng: Math.min(...allCoords.map((p) => p.longitude)),
      maxLng: Math.max(...allCoords.map((p) => p.longitude)),
    };

    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#f3faf9";
    ctx.strokeStyle = "rgba(28, 167, 166, 0.28)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 18);
    ctx.fill();
    ctx.stroke();

    // Route line
    ctx.beginPath();

    routePoints.forEach((coord, index) => {
      const p = projectPoint(coord, bounds, innerWidth, innerHeight);
      const x = p.x + padding;
      const y = p.y + padding;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = "#1ca7a6";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Route markers between launch and takeout
    routeMarkers
      .filter((point) => point.id !== start.id && point.id !== end.id)
      .forEach((point) => {
        const p = projectPoint(point, bounds, innerWidth, innerHeight);
        const color = point.type === "hazard" ? "#9f1d1d" : "#3468c9";

        drawMarker(
          ctx,
          p.x + padding,
          p.y + padding,
          point.name,
          color
        );
      });

    // Launch / takeout markers last so they stay on top
    const launchPoint = projectPoint(start, bounds, innerWidth, innerHeight);
    drawMarker(
      ctx,
      launchPoint.x + padding,
      launchPoint.y + padding,
      "Launch",
      "#18a558"
    );

    const takeoutPoint = projectPoint(end, bounds, innerWidth, innerHeight);
    drawMarker(
      ctx,
      takeoutPoint.x + padding,
      takeoutPoint.y + padding,
      "Takeout",
      "#d64545"
    );
  }, [river, start, end]);

  return (
    <div className="print-map-wrapper">
      <h3>Route Map</h3>

      <canvas
        ref={canvasRef}
        className="print-route-map"
        aria-label="Printable route map"
      />
    </div>
  );
}