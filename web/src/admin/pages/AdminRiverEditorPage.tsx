import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";

import { fetchRivers, updateRiver, updateRiverPoint, createRiverPoint } from "../../services/riverService";
import type { River, RiverPoint, RiverPointType } from "@yakquest/shared";
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

type NewPointForm = {
  name: string;
  type: RiverPointType;
  latitude: string;
  longitude: string;
  description: string;
  parking: boolean;
  restroom: boolean;
  camping: boolean;
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

type MapClickPointPickerProps = {
  enabled: boolean;
  onPick: (latitude: number, longitude: number) => void;
};

function MapClickPointPicker({
  enabled,
  onPick,
}: MapClickPointPickerProps) {
  useMapEvents({
    click(event) {
      if (!enabled) return;

      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

export default function AdminRiverEditorPage() {
  const { riverId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const editPointRef = useRef<HTMLDivElement | null>(null);

  const { data: rivers = [], isLoading, error } = useQuery({
    queryKey: ["rivers"],
    queryFn: fetchRivers,
  });

  const river = rivers.find((item) => item.id === riverId);

  const [form, setForm] = useState<RiverEditForm | null>(null);
  const [pickingPoint, setPickingPoint] = useState(false);

  const [newPoint, setNewPoint] = useState<NewPointForm>({
    name: "",
    type: "public_access",
    latitude: "",
    longitude: "",
    description: "",
    parking: false,
    restroom: false,
    camping: false,
  });

  const [editingPoint, setEditingPoint] = useState<RiverPoint | null>(null);

  const [pointEditForm, setPointEditForm] = useState({
    name: "",
    description: "",
    parking: false,
    restroom: false,
    camping: false,
  });

  function startEditingPoint(point: RiverPoint) {
    setEditingPoint(point);
    setPointEditForm({
      name: point.name,
      description: point.description ?? "",
      parking: !!point.parking,
      restroom: !!point.restroom,
      camping: !!point.camping,
    });

    setTimeout(() => {
      editPointRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function updatePointEdit<K extends keyof typeof pointEditForm>(
    key: K,
    value: (typeof pointEditForm)[K]
  ) {
    setPointEditForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function savePointEdit() {
    if (!editingPoint) return;

    try {
      await updateRiverPoint(editingPoint.id, {
        name: pointEditForm.name.trim(),
        description: pointEditForm.description.trim() || null,
        parking: pointEditForm.parking,
        restroom: pointEditForm.restroom,
        camping: pointEditForm.camping,
      });

      await queryClient.invalidateQueries({
        queryKey: ["rivers"],
      });

      setEditingPoint(null);
      alert("Point updated.");
    } catch (error) {
      console.error(error);
      alert("Failed to update point.");
    }
  }

  function updateNewPoint<K extends keyof NewPointForm>(
    key: K,
    value: NewPointForm[K]
  ) {
    setNewPoint((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function createPoint() {
    if (!river) return;

    const latitude = Number(newPoint.latitude);
    const longitude = Number(newPoint.longitude);

    if (!newPoint.name.trim()) {
      alert("Point name is required.");
      return;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      alert("Latitude and longitude must be valid numbers.");
      return;
    }

    try {
      await createRiverPoint(river.id, {
        name: newPoint.name.trim(),
        type: newPoint.type,
        latitude,
        longitude,
        description: newPoint.description.trim() || null,
        parking: newPoint.parking,
        restroom: newPoint.restroom,
        camping: newPoint.camping,
      });

      await queryClient.invalidateQueries({
        queryKey: ["rivers"],
      });

      setNewPoint({
        name: "",
        type: "public_access",
        latitude: "",
        longitude: "",
        description: "",
        parking: false,
        restroom: false,
        camping: false,
      });

      alert("Point created.");
    } catch (error) {
      console.error(error);
      alert("Failed to create point.");
    }
  }

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

  async function deactivatePoint(point: RiverPoint) {
    const confirmed = window.confirm(
      `Deactivate "${point.name}"? It will be hidden from public river data.`
    );

    if (!confirmed) return;

    try {
      await updateRiverPoint(point.id, {
        isActive: false,
      });

      await queryClient.invalidateQueries({
        queryKey: ["rivers"],
      });

      alert("Point deactivated.");
    } catch (error) {
      console.error(error);
      alert("Failed to deactivate point.");
    }
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

          <div className="admin-editor-section">
            <h2>Add Point</h2>

            <label className="form-label">
              Name
              <input
                value={newPoint.name}
                onChange={(event) => updateNewPoint("name", event.target.value)}
              />
            </label>

            <label className="form-label">
              Type
              <select
                value={newPoint.type}
                onChange={(event) =>
                  updateNewPoint("type", event.target.value as RiverPointType)
                }
              >
                <option value="public_access">Public Access</option>
                <option value="private_access">Private Access</option>
                <option value="poi">Point of Interest</option>
                <option value="hazard">Hazard</option>
              </select>
            </label>

            <div className="admin-score-grid">
              <label className="form-label">
                Latitude
                <input
                  value={newPoint.latitude}
                  onChange={(event) =>
                    updateNewPoint("latitude", event.target.value)
                  }
                />
              </label>

              <label className="form-label">
                Longitude
                <input
                  value={newPoint.longitude}
                  onChange={(event) =>
                    updateNewPoint("longitude", event.target.value)
                  }
                />
              </label>
            </div>

            <button
              type="button"
              className={`secondary-button admin-pick-button ${
                pickingPoint ? "active" : ""
              }`}
              onClick={() => setPickingPoint((current) => !current)}
            >
              {pickingPoint ? "Click the Map..." : "Pick on Map"}
            </button>

            <label className="form-label">
              Description
              <textarea
                value={newPoint.description}
                onChange={(event) =>
                  updateNewPoint("description", event.target.value)
                }
              />
            </label>

            <div className="admin-checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={newPoint.parking}
                  onChange={(event) =>
                    updateNewPoint("parking", event.target.checked)
                  }
                />
                Parking
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={newPoint.restroom}
                  onChange={(event) =>
                    updateNewPoint("restroom", event.target.checked)
                  }
                />
                Restroom
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={newPoint.camping}
                  onChange={(event) =>
                    updateNewPoint("camping", event.target.checked)
                  }
                />
                Camping
              </label>
            </div>

            <button
              type="button"
              className="primary-button admin-save-button"
              onClick={createPoint}
            >
              Create Point
            </button>
          </div>

          {editingPoint ? (
            <div ref={editPointRef} className="admin-editor-section">
              <h2>Edit Point</h2>

              <p className="muted">
                Editing {editingPoint.type}
              </p>

              <label className="form-label">
                Name
                <input
                  value={pointEditForm.name}
                  onChange={(event) =>
                    updatePointEdit("name", event.target.value)
                  }
                />
              </label>

              <label className="form-label">
                Description
                <textarea
                  value={pointEditForm.description}
                  onChange={(event) =>
                    updatePointEdit("description", event.target.value)
                  }
                />
              </label>

              <div className="admin-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={pointEditForm.parking}
                    onChange={(event) =>
                      updatePointEdit("parking", event.target.checked)
                    }
                  />
                  Parking
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={pointEditForm.restroom}
                    onChange={(event) =>
                      updatePointEdit("restroom", event.target.checked)
                    }
                  />
                  Restroom
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={pointEditForm.camping}
                    onChange={(event) =>
                      updatePointEdit("camping", event.target.checked)
                    }
                  />
                  Camping
                </label>
              </div>

              <div className="admin-inline-actions">
                <button
                  type="button"
                  className="primary-button admin-save-button"
                  onClick={savePointEdit}
                >
                  Save Point
                </button>

                <button
                  type="button"
                  className="secondary-button admin-cancel-button"
                  onClick={() => setEditingPoint(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div className="admin-editor-section">
            <h2>Access Points</h2>

            {[...river.accessPoints.public, ...river.accessPoints.private].map(
              (point) => (
                <div key={point.id} className="admin-point-row">
                  <div>
                    <strong>{point.name}</strong>
                    <p>{point.type}</p>
                  </div>

                  <div className="admin-point-actions">
                    <button
                      type="button"
                      className="secondary-button small-action-button"
                      onClick={() => startEditingPoint(point)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => deactivatePoint(point)}
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="admin-editor-section">
            <h2>POIs</h2>

            {river.pois.length ? (
              river.pois.map((point) => (
                <div key={point.id} className="admin-point-row">
                  <div>
                    <strong>{point.name}</strong>
                    <p>{point.description || point.type}</p>
                  </div>

                  <div className="admin-point-actions">
                    <button
                      type="button"
                      className="secondary-button small-action-button"
                      onClick={() => startEditingPoint(point)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => deactivatePoint(point)}
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No POIs listed.</p>
            )}
          </div>

          <div className="admin-editor-section">
            <h2>Hazards</h2>

            {(river.hazards ?? []).length ? (
              (river.hazards ?? []).map((point) => (
                <div key={point.id} className="admin-point-row">
                  <div>
                    <strong>{point.name}</strong>
                    <p>{point.description || point.type}</p>
                  </div>

                  <div className="admin-point-actions">
                    <button
                      type="button"
                      className="secondary-button small-action-button"
                      onClick={() => startEditingPoint(point)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => deactivatePoint(point)}
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No hazards listed.</p>
            )}
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

            <MapClickPointPicker
              enabled={pickingPoint}
              onPick={(latitude, longitude) => {
                updateNewPoint("latitude", latitude.toFixed(6));
                updateNewPoint("longitude", longitude.toFixed(6));
                setPickingPoint(false);
              }}
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
                draggable
                eventHandlers={{
                  dragend: async (event) => {
                    const marker = event.target;
                    const latLng = marker.getLatLng();

                    const confirmed = window.confirm(
                      `Move "${point.name}" to this new location?`
                    );

                    if (!confirmed) {
                      marker.setLatLng([point.latitude, point.longitude]);
                      return;
                    }

                    try {
                      await updateRiverPoint(point.id, {
                        latitude: latLng.lat,
                        longitude: latLng.lng,
                      });

                      await queryClient.invalidateQueries({
                        queryKey: ["rivers"],
                      });
                    } catch (error) {
                      console.error(error);
                      alert("Failed to move point.");
                      marker.setLatLng([point.latitude, point.longitude]);
                    }
                  },
                }}
              >
                <Popup>
                  <strong>{point.name}</strong>
                  <br />
                  {point.type}

                  {point.description ? (
                    <>
                      <br />
                      {point.description}
                    </>
                  ) : null}

                  <div className="admin-popup-actions">
                    <button
                      type="button"
                      className="popup-button"
                      onClick={() => startEditingPoint(point)}
                    >
                      Edit Point
                    </button>

                    <button
                      type="button"
                      className="popup-button danger-popup-button"
                      onClick={() => deactivatePoint(point)}
                    >
                      Deactivate
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            {newPoint.latitude && newPoint.longitude ? (
              <Marker
                position={[
                  Number(newPoint.latitude),
                  Number(newPoint.longitude),
                ]}
              >
                <Popup>
                  New point preview
                  <br />
                  {newPoint.name || "Unnamed point"}
                </Popup>
              </Marker>
            ) : null}
          </MapContainer>
        </div>
      </div>
    </section>
  );
}