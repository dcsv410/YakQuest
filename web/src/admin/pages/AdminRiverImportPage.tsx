import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  Polyline,
  TileLayer,
} from "react-leaflet";

import type { Coordinate } from "@yakquest/shared";
import FitRiverBounds from "../../components/FitRiverBounds";

function parseKmlCoordinates(kmlText: string): Coordinate[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlText, "application/xml");

  const coordinatesNodes = Array.from(
    doc.getElementsByTagName("coordinates")
  );

  const coordinates: Coordinate[] = [];

  for (const node of coordinatesNodes) {
    const raw = node.textContent ?? "";

    const parsed = raw
      .trim()
      .split(/\s+/)
      .map((chunk) => {
        const [longitude, latitude] = chunk.split(",").map(Number);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }

        return {
          latitude,
          longitude,
        };
      })
      .filter((coord): coord is Coordinate => coord !== null);

    coordinates.push(...parsed);
  }

  return coordinates;
}

export default function AdminRiverImportPage() {
  const [fileName, setFileName] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [error, setError] = useState("");

  const mapCenter: [number, number] = coordinates.length
    ? [coordinates[0].latitude, coordinates[0].longitude]
    : [35.1, -86.5];

  const stats = useMemo(() => {
    if (!coordinates.length) return null;

    const lats = coordinates.map((coord) => coord.latitude);
    const lngs = coordinates.map((coord) => coord.longitude);

    return {
      coordinateCount: coordinates.length,
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [coordinates]);

  async function handleFile(file: File) {
    setError("");
    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".kml")) {
      setCoordinates([]);
      setError("Please upload a .kml file.");
      return;
    }

    const text = await file.text();
    const parsed = parseKmlCoordinates(text);

    if (!parsed.length) {
      setCoordinates([]);
      setError("No coordinates found in this KML file.");
      return;
    }

    setCoordinates(parsed);
  }

  return (
    <section className="admin-import-page">
      <div className="admin-editor-header">
        <div>
          <p className="eyebrow">River Import</p>
          <h1>Import River KML</h1>
          <p className="muted">
            Upload a KML file to preview the river path before saving it.
          </p>
        </div>

        <Link className="secondary-button admin-editor-back" to="/admin/rivers">
          Back to Rivers
        </Link>
      </div>

      <div className="admin-import-grid">
        <aside className="admin-editor-section">
          <h2>Upload KML</h2>

          <label className="kml-drop-zone">
            <input
              type="file"
              accept=".kml,application/vnd.google-earth.kml+xml"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            <strong>Choose KML file</strong>
            <span>{fileName || "No file selected"}</span>
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          {stats ? (
            <div className="admin-import-stats">
              <div>
                <span>Coordinates</span>
                <strong>{stats.coordinateCount}</strong>
              </div>

              <div>
                <span>Latitude Range</span>
                <strong>
                  {stats.minLat.toFixed(4)} → {stats.maxLat.toFixed(4)}
                </strong>
              </div>

              <div>
                <span>Longitude Range</span>
                <strong>
                  {stats.minLng.toFixed(4)} → {stats.maxLng.toFixed(4)}
                </strong>
              </div>
            </div>
          ) : null}

          <button
            className="primary-button admin-save-button"
            disabled={!coordinates.length}
            type="button"
          >
            Continue to Metadata
          </button>
        </aside>

        <div className="admin-import-map-panel">
          <MapContainer
            center={mapCenter}
            zoom={10}
            scrollWheelZoom
            className="admin-import-map"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {coordinates.length ? (
              <>
                <FitRiverBounds coordinates={coordinates} />

                <Polyline
                  positions={coordinates.map((coord) => [
                    coord.latitude,
                    coord.longitude,
                  ])}
                  pathOptions={{
                    weight: 6,
                    opacity: 0.9,
                  }}
                />
              </>
            ) : null}
          </MapContainer>
        </div>
      </div>
    </section>
  );
}