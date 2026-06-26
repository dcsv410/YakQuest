import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";

import { fetchRivers, updateRiver } from "../../services/riverService";
import type { River } from "@yakquest/shared";
import FitRiverBounds from "../../components/FitRiverBounds";

type RiverEditForm = {
  name: string;
  state: string;
  difficulty: number;
  cleanliness: number;
  fishing: number;
  usgsGaugeId: string;
  lowPercentile: string;
  median: string;
  highPercentile: string;
  max: string;
};

function getInitialForm(river: River): RiverEditForm {
  return {
    name: river.name,
    state: river.state,
    difficulty: river.difficulty,
    cleanliness: river.cleanliness,
    fishing: river.fishing,
    usgsGaugeId: river.usgsGaugeId ?? "",
    lowPercentile: river.flowStats?.lowPercentile?.toString() ?? "",
    median: river.flowStats?.median?.toString() ?? "",
    highPercentile: river.flowStats?.highPercentile?.toString() ?? "",
    max: river.flowStats?.max?.toString() ?? "",
  };
}

export default function AdminRiverEditorPage() {
  const { riverId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: rivers = [], isLoading, error } = useQuery({
    queryKey: ["rivers"],
    queryFn: fetchRivers,
  });

  const river = rivers.find((item) => item.id === riverId);

  const [form, setForm] = useState<RiverEditForm | null>(null);

  useEffect(() => {
    if (river) {
        setForm(getInitialForm(river));
    }
    }, [river]);

  if (isLoading) {
    return <p>Loading river editor...</p>;
  }

  if (error) {
    return <p>Unable to load river.</p>;
  }

  if (!river || !form) {
    return (
      <div>
        <h1>River not found</h1>
        <Link to="/admin/rivers">Back to Rivers</Link>
      </div>
    );
  }

  function updateForm<K extends keyof RiverEditForm>(
    key: K,
    value: RiverEditForm[K]
  ) {
    setForm((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!river || !form) return;

    setSaving(true);

    try {
      await updateRiver(river.id, {
        name: form.name.trim(),
        state: form.state.trim().toUpperCase(),
        difficulty: form.difficulty,
        cleanliness: form.cleanliness,
        fishing: form.fishing,
        usgsGaugeId: form.usgsGaugeId.trim() || null,
        flowStats: {
          lowPercentile: Number(form.lowPercentile),
          median: Number(form.median),
          highPercentile: Number(form.highPercentile),
          max: Number(form.max),
        },
      });

      await queryClient.invalidateQueries({
        queryKey: ["rivers"],
      });

      navigate("/admin/rivers");
    } catch (error) {
      console.error(error);
      alert("Failed to save river.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-editor-page">
      <div className="admin-editor-header">
        <div>
          <p className="eyebrow">River Editor</p>
          <h1>{river.name}</h1>
          <p className="muted">
            Edit river metadata, flow thresholds, and route details.
          </p>
        </div>

        <Link className="secondary-button admin-editor-back" to="/admin/rivers">
          Back to Rivers
        </Link>
      </div>

      <div className="admin-editor-grid">
        <form className="admin-editor-form" onSubmit={handleSubmit}>
          <div className="admin-editor-section">
            <h2>River Details</h2>

            <label className="form-label">
              River Name
              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
              />
            </label>

            <label className="form-label">
              State
              <input
                value={form.state}
                onChange={(event) =>
                  updateForm("state", event.target.value.toUpperCase())
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
                  value={form.difficulty}
                  onChange={(event) =>
                    updateForm("difficulty", Number(event.target.value))
                  }
                />
              </label>

              <label className="form-label">
                Cleanliness
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.cleanliness}
                  onChange={(event) =>
                    updateForm("cleanliness", Number(event.target.value))
                  }
                />
              </label>

              <label className="form-label">
                Fishing
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.fishing}
                  onChange={(event) =>
                    updateForm("fishing", Number(event.target.value))
                  }
                />
              </label>
            </div>

            <label className="form-label">
              USGS Gauge ID
              <input
                value={form.usgsGaugeId}
                onChange={(event) =>
                  updateForm("usgsGaugeId", event.target.value)
                }
              />
            </label>
          </div>

          <div className="admin-editor-section">
            <h2>Flow Thresholds</h2>

            <div className="admin-score-grid">
              <label className="form-label">
                Low
                <input
                  value={form.lowPercentile}
                  onChange={(event) =>
                    updateForm("lowPercentile", event.target.value)
                  }
                />
              </label>

              <label className="form-label">
                Median
                <input
                  value={form.median}
                  onChange={(event) =>
                    updateForm("median", event.target.value)
                  }
                />
              </label>

              <label className="form-label">
                High
                <input
                  value={form.highPercentile}
                  onChange={(event) =>
                    updateForm("highPercentile", event.target.value)
                  }
                />
              </label>

              <label className="form-label">
                Max
                <input
                  value={form.max}
                  onChange={(event) => updateForm("max", event.target.value)}
                />
              </label>
            </div>
          </div>

          <button className="primary-button admin-save-button" disabled={saving}>
            {saving ? "Saving..." : "Save River"}
          </button>
        </form>

        <div className="admin-editor-map-panel">
          <MapContainer
            center={[
              river.coordinates[0]?.latitude ?? 35.1,
              river.coordinates[0]?.longitude ?? -86.5,
            ]}
            zoom={12}
            scrollWheelZoom
            className="admin-editor-map"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitRiverBounds coordinates={river.coordinates} />

            <Polyline
              positions={river.coordinates.map((coord) => [
                coord.latitude,
                coord.longitude,
              ])}
              pathOptions={{
                weight: 6,
                opacity: 0.9,
              }}
            />

            {[
              ...river.accessPoints.public,
              ...river.accessPoints.private,
              ...river.pois,
              ...(river.hazards ?? []),
            ].map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
              >
                <Popup>
                  <strong>{point.name}</strong>
                  <br />
                  {point.type}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </section>
  );
}