import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import { useQueryClient } from "@tanstack/react-query";

import { createRiver } from "../../services/riverService";
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

        return { latitude, longitude };
      })
      .filter((coord): coord is Coordinate => coord !== null);

    coordinates.push(...parsed);
  }

  return coordinates;
}

export default function AdminRiverImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fileName, setFileName] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [error, setError] = useState("");

  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  const [metadata, setMetadata] = useState({
    name: "",
    state: "AL",
    difficulty: 3,
    cleanliness: 3,
    fishing: 3,
    usgsGaugeId: "",
    lowPercentile: "",
    median: "",
    highPercentile: "",
    max: "",
  });

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

  function updateMetadata<K extends keyof typeof metadata>(
    key: K,
    value: (typeof metadata)[K]
  ) {
    setMetadata((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleFile(file: File) {
    setError("");
    setFileName(file.name);
    setStep(1);

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

  async function saveRiver() {
    if (!coordinates.length) {
      alert("Upload a KML first.");
      return;
    }

    if (!metadata.name.trim()) {
      alert("River name is required.");
      return;
    }

    setSaving(true);

    try {
      const hasFlowStats =
        metadata.lowPercentile &&
        metadata.median &&
        metadata.highPercentile &&
        metadata.max;

      const river = await createRiver({
        name: metadata.name.trim(),
        state: metadata.state.trim().toUpperCase(),
        difficulty: Number(metadata.difficulty),
        cleanliness: Number(metadata.cleanliness),
        fishing: Number(metadata.fishing),
        usgsGaugeId: metadata.usgsGaugeId.trim() || null,
        flowStats: hasFlowStats
          ? {
              lowPercentile: Number(metadata.lowPercentile),
              median: Number(metadata.median),
              highPercentile: Number(metadata.highPercentile),
              max: Number(metadata.max),
            }
          : null,
        coordinates,
      });

      await queryClient.invalidateQueries({
        queryKey: ["rivers"],
      });

      navigate(`/admin/rivers/${river.id}/edit`);
    } catch (error) {
      console.error(error);
      alert("Failed to create river.");
    } finally {
      setSaving(false);
    }
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
            onClick={() => setStep(2)}
          >
            Continue to Metadata
          </button>

          {step === 2 ? (
            <div className="admin-import-metadata">
              <h2>River Metadata</h2>

              <label className="form-label">
                River Name
                <input
                  value={metadata.name}
                  onChange={(event) =>
                    updateMetadata("name", event.target.value)
                  }
                />
              </label>

              <label className="form-label">
                State
                <input
                  value={metadata.state}
                  onChange={(event) =>
                    updateMetadata("state", event.target.value.toUpperCase())
                  }
                />
              </label>

              <div className="admin-score-grid">
                <label className="form-label">
                  Difficulty
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={metadata.difficulty}
                    onChange={(event) =>
                      updateMetadata("difficulty", Number(event.target.value))
                    }
                  />
                </label>

                <label className="form-label">
                  Cleanliness
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={metadata.cleanliness}
                    onChange={(event) =>
                      updateMetadata("cleanliness", Number(event.target.value))
                    }
                  />
                </label>

                <label className="form-label">
                  Fishing
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={metadata.fishing}
                    onChange={(event) =>
                      updateMetadata("fishing", Number(event.target.value))
                    }
                  />
                </label>
              </div>

              <label className="form-label">
                USGS Gauge ID
                <input
                  value={metadata.usgsGaugeId}
                  onChange={(event) =>
                    updateMetadata("usgsGaugeId", event.target.value)
                  }
                />
              </label>

              <h3>Flow Thresholds</h3>

              <div className="admin-score-grid">
                <label className="form-label">
                  Low
                  <input
                    value={metadata.lowPercentile}
                    onChange={(event) =>
                      updateMetadata("lowPercentile", event.target.value)
                    }
                  />
                </label>

                <label className="form-label">
                  Median
                  <input
                    value={metadata.median}
                    onChange={(event) =>
                      updateMetadata("median", event.target.value)
                    }
                  />
                </label>

                <label className="form-label">
                  High
                  <input
                    value={metadata.highPercentile}
                    onChange={(event) =>
                      updateMetadata("highPercentile", event.target.value)
                    }
                  />
                </label>

                <label className="form-label">
                  Max
                  <input
                    value={metadata.max}
                    onChange={(event) =>
                      updateMetadata("max", event.target.value)
                    }
                  />
                </label>
              </div>

              <button
                type="button"
                className="primary-button admin-save-button"
                disabled={saving}
                onClick={saveRiver}
              >
                {saving ? "Saving..." : "Create River"}
              </button>
            </div>
          ) : null}
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