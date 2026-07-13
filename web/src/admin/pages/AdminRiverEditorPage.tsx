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
import L from "leaflet";

import {
  createOutfitter,
  createRiverPoint,
  fetchAdminRiver,
  fetchAdminRiverOutfitters,
  fetchRivers,
  updateOutfitter,
  updateRiver,
  updateRiverPoint,
  deleteRiverPointPhoto,
} from "../../services/riverService";
import type {
  AdminRiverPointDTO,
  Outfitter,
  River,
  RiverPoint,
  RiverPointType,
} from "@yakquest/shared";
import FitRiverBounds from "../../components/FitRiverBounds";
import { distanceFeet } from "@yakquest/shared";

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

function getPointMarkerClass(type: string) {
  switch (type) {
    case "public_access":
      return "admin-marker-public";
    case "private_access":
      return "admin-marker-private";
    case "poi":
      return "admin-marker-poi";
    case "hazard":
      return "admin-marker-hazard";
    default:
      return "admin-marker-default";
  }
}

function getPointIcon(type: string) {
  return L.divIcon({
    className: `admin-map-marker ${getPointMarkerClass(type)}`,
    html: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const newPointIcon = L.divIcon({
  className: "admin-map-marker admin-marker-new",
  html: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function AdminRiverEditorPage() {
  const { riverId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const editPointRef = useRef<HTMLDivElement | null>(null);
  const addPointRef = useRef<HTMLDivElement | null>(null);

  const { data: rivers = [], isLoading, error } = useQuery({
    queryKey: ["rivers"],
    queryFn: fetchRivers,
  });

  const { data: outfitters = [] } = useQuery({
    queryKey: ["adminRiverOutfitters", riverId],
    queryFn: () => fetchAdminRiverOutfitters(riverId ?? ""),
    enabled: !!riverId,
  });

  const [editingOutfitter, setEditingOutfitter] =
    useState<Outfitter | null>(null);

  const [outfitterForm, setOutfitterForm] = useState({
    name: "",
    website: "",
    phone: "",
    email: "",
    description: "",
    highestPutInPointId: "",
    lowestTakeOutPointId: "",
    accessPointIds: [] as string[],
  });

  const { data: adminRiver } = useQuery({
    queryKey: ["adminRiver", riverId],
    queryFn: () => fetchAdminRiver(riverId ?? ""),
    enabled: !!riverId,
  });

  const [showInactivePoints, setShowInactivePoints] = useState(false);

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
    type: "poi" as RiverPointType,
    description: "",
    latitude: "",
    longitude: "",
    parking: false,
    restroom: false,
    camping: false,
    website: "",
    phone: "",
  });

  const [markerFilters, setMarkerFilters] = useState({
    access: true,
    poi: true,
    hazard: true,
    newPoint: true,
  });

  function toggleMarkerFilter(key: keyof typeof markerFilters) {
    setMarkerFilters((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function startEditingPoint(point: RiverPoint) {
    const pointWithAdminData =
      adminRiver?.points.find((adminPoint) => adminPoint.id === point.id) ??
      point;

    setEditingPoint(pointWithAdminData);

    setPointEditForm({
      name: pointWithAdminData.name,
      type: pointWithAdminData.type,
      description: pointWithAdminData.description ?? "",
      latitude: pointWithAdminData.latitude.toFixed(6),
      longitude: pointWithAdminData.longitude.toFixed(6),
      parking: !!pointWithAdminData.parking,
      restroom: !!pointWithAdminData.restroom,
      camping: !!pointWithAdminData.camping,
      website: pointWithAdminData.website ?? "",
      phone: pointWithAdminData.phone ?? "",
    });

    setTimeout(() => {
      editPointRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  useEffect(() => {
    if (!editingPoint || !adminRiver) return;

    const refreshedPoint = adminRiver.points.find(
      (point) => point.id === editingPoint.id
    );

    if (!refreshedPoint) return;

    setEditingPoint((current) => {
      if (!current) return current;

      return {
        ...current,
        ...refreshedPoint,
        photos: refreshedPoint.photos ?? [],
      };
    });
  }, [adminRiver, editingPoint?.id]);

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
    const latitude = Number(pointEditForm.latitude);
    const longitude = Number(pointEditForm.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      alert("Latitude and longitude must be valid numbers.");
      return;
    }

    try {
      await updateRiverPoint(editingPoint.id, {
      name: pointEditForm.name.trim(),
      type: pointEditForm.type,
      description: pointEditForm.description.trim() || null,
      latitude,
      longitude,
      parking: pointEditForm.parking,
      restroom: pointEditForm.restroom,
      camping: pointEditForm.camping,
      website: pointEditForm.website.trim() || null,
      phone: pointEditForm.phone.trim() || null,
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

  async function removePointPhoto(photoIndex: number) {
    if (!editingPoint) return;

    const confirmed = window.confirm(
      "Remove this photo from the point? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      await deleteRiverPointPhoto(editingPoint.id, photoIndex);

      await queryClient.invalidateQueries({
        queryKey: ["rivers"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["adminRiver", riverId],
      });

      setEditingPoint((current) => {
        if (!current) return current;

        return {
          ...current,
          photos: (current.photos ?? []).filter(
            (_, index) => index !== photoIndex
          ),
        };
      });

      alert("Photo removed.");
    } catch (error) {
      console.error(error);
      alert("Failed to remove photo.");
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

  function findNearbyDuplicatePoint() {
    const latitude = Number(newPoint.latitude);
    const longitude = Number(newPoint.longitude);

    if (!river || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const candidate = {
      latitude,
      longitude,
    };

    const allPoints = [
      ...river.accessPoints.public,
      ...river.accessPoints.private,
      ...river.pois,
      ...(river.hazards ?? []),
    ];

    const nearby = allPoints
      .map((point) => ({
        point,
        distance: distanceFeet(candidate, point),
      }))
      .filter(({ point, distance }) => {
        const sameType =
          point.type === newPoint.type ||
          ((point.type === "public_access" ||
            point.type === "private_access") &&
            (newPoint.type === "public_access" ||
              newPoint.type === "private_access"));

        return sameType && distance <= 75;
      })
      .sort((a, b) => a.distance - b.distance)[0];

    return nearby ?? null;
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

    const nearbyDuplicate = findNearbyDuplicatePoint();

    if (nearbyDuplicate) {
      const confirmed = window.confirm(
        `"${nearbyDuplicate.point.name}" is already ${Math.round(
          nearbyDuplicate.distance
        )} feet away.\n\nCreate this point anyway?`
      );

      if (!confirmed) return;
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

  const allAccessPoints = [
    ...river.accessPoints.public,
    ...river.accessPoints.private,
  ];

  function updateOutfitterForm<K extends keyof typeof outfitterForm>(
    key: K,
    value: (typeof outfitterForm)[K]
  ) {
    setOutfitterForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetOutfitterForm() {
    setEditingOutfitter(null);
    setOutfitterForm({
      name: "",
      website: "",
      phone: "",
      email: "",
      description: "",
      highestPutInPointId: "",
      lowestTakeOutPointId: "",
      accessPointIds: [],
    });
  }

  function startEditingOutfitter(outfitter: Outfitter) {
    setEditingOutfitter(outfitter);
    setOutfitterForm({
      name: outfitter.name,
      website: outfitter.website ?? "",
      phone: outfitter.phone ?? "",
      email: outfitter.email ?? "",
      description: outfitter.description ?? "",
      highestPutInPointId: outfitter.highestPutInPointId ?? "",
      lowestTakeOutPointId: outfitter.lowestTakeOutPointId ?? "",
      accessPointIds: outfitter.accessPointIds ?? [],
    });
  }

  function toggleOutfitterAccessPoint(pointId: string) {
    setOutfitterForm((current) => {
      const exists = current.accessPointIds.includes(pointId);

      return {
        ...current,
        accessPointIds: exists
          ? current.accessPointIds.filter((id) => id !== pointId)
          : [...current.accessPointIds, pointId],
      };
    });
  }

  async function saveOutfitter() {
    if (!river) return;

    if (!outfitterForm.name.trim()) {
      alert("Outfitter name is required.");
      return;
    }

    try {
      const payload = {
        name: outfitterForm.name.trim(),
        website: outfitterForm.website.trim() || null,
        phone: outfitterForm.phone.trim() || null,
        email: outfitterForm.email.trim() || null,
        description: outfitterForm.description.trim() || null,
        highestPutInPointId: outfitterForm.highestPutInPointId || null,
        lowestTakeOutPointId: outfitterForm.lowestTakeOutPointId || null,
        accessPointIds: outfitterForm.accessPointIds,
      };

      if (editingOutfitter) {
        await updateOutfitter(editingOutfitter.id, payload);
      } else {
        await createOutfitter({
          riverId: river.id,
          ...payload,
        });
      }

      await queryClient.invalidateQueries({
        queryKey: ["adminRiverOutfitters", riverId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["riverOutfitters", riverId],
      });

      resetOutfitterForm();
      alert("Outfitter saved.");
    } catch (error) {
      console.error(error);
      alert("Failed to save outfitter.");
    }
  }

  async function setOutfitterActive(outfitter: Outfitter, isActive: boolean) {
    try {
      await updateOutfitter(outfitter.id, {
        isActive,
      });

      await queryClient.invalidateQueries({
        queryKey: ["adminRiverOutfitters", riverId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["riverOutfitters", riverId],
      });
    } catch (error) {
      console.error(error);
      alert("Failed to update outfitter.");
    }
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

      await queryClient.invalidateQueries({
        queryKey: ["adminRiver", riverId],
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

  const visibleEditorPoints = [
    ...river.accessPoints.public,
    ...river.accessPoints.private,
    ...river.pois,
    ...(river.hazards ?? []),
  ].filter((point) => {
    if (
      (point.type === "public_access" || point.type === "private_access") &&
      !markerFilters.access
    ) {
      return false;
    }

    if (point.type === "poi" && !markerFilters.poi) {
      return false;
    }

    if (point.type === "hazard" && !markerFilters.hazard) {
      return false;
    }

    return true;
  });

  const inactivePoints: AdminRiverPointDTO[] =
    adminRiver?.points.filter((point) => !point.isActive) ?? [];

  async function reactivatePoint(point: AdminRiverPointDTO) {
    try {
      await updateRiverPoint(point.id, {
        isActive: true,
      });

      await queryClient.invalidateQueries({
        queryKey: ["rivers"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["adminRiver", riverId],
      });

      alert("Point reactivated.");
    } catch (error) {
      console.error(error);
      alert("Failed to reactivate point.");
    }
  }

  const newPointLatitude = Number(newPoint.latitude);
  const newPointLongitude = Number(newPoint.longitude);

  const hasValidNewPointLocation =
    Number.isFinite(newPointLatitude) &&
    Number.isFinite(newPointLongitude);

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

          <div ref={addPointRef} className="admin-editor-section">
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

            <button
              type="button"
              className={`secondary-button admin-pick-button ${
                pickingPoint ? "active" : ""
              }`}
              onClick={() => setPickingPoint((current) => !current)}
            >
              {pickingPoint ? "Click the Map..." : "Pick on Map"}
            </button>

            {pickingPoint ? (
              <p className="muted">
                Click anywhere on the map to set the new point location.
              </p>
            ) : null}

            <label className="form-label">
              Description
              <textarea
                value={newPoint.description}
                onChange={(event) =>
                  updateNewPoint("description", event.target.value)
                }
              />
            </label>

            <div className="admin-score-grid">
              <label className="form-label">
                Latitude
                <input
                  type="text"
                  inputMode="decimal"
                  value={newPoint.latitude}
                  onChange={(event) =>
                    updateNewPoint("latitude", event.target.value)
                  }
                />
              </label>

              <label className="form-label">
                Longitude
                <input
                  type="text"
                  inputMode="decimal"
                  value={newPoint.longitude}
                  onChange={(event) =>
                    updateNewPoint("longitude", event.target.value)
                  }
                />
              </label>
            </div>

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
                Type
                <select
                  value={pointEditForm.type}
                  onChange={(event) =>
                    updatePointEdit("type", event.target.value as RiverPointType)
                  }
                >
                  <option value="public_access">Public Access</option>
                  <option value="private_access">Private Access</option>
                  <option value="poi">Point of Interest</option>
                  <option value="hazard">Hazard</option>
                </select>
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

              <div className="admin-score-grid">
                <label className="form-label">
                  Latitude
                  <input
                    value={pointEditForm.latitude}
                    onChange={(event) =>
                      updatePointEdit("latitude", event.target.value)
                    }
                  />
                </label>

                <label className="form-label">
                  Longitude
                  <input
                    value={pointEditForm.longitude}
                    onChange={(event) =>
                      updatePointEdit("longitude", event.target.value)
                    }
                  />
                </label>
              </div>

              <label className="form-label">
                Website
                <input
                  value={pointEditForm.website}
                  onChange={(event) =>
                    updatePointEdit("website", event.target.value)
                  }
                />
              </label>

              <label className="form-label">
                Phone
                <input
                  value={pointEditForm.phone}
                  onChange={(event) =>
                    updatePointEdit("phone", event.target.value)
                  }
                />
              </label>

              <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>
                {JSON.stringify(
                  {
                    editingPointId: editingPoint.id,
                    editingPointPhotos: editingPoint.photos,
                    adminPoint: adminRiver?.points.find(
                      (point) => point.id === editingPoint.id
                    ),
                  },
                  null,
                  2
                )}
              </pre>

              <div className="admin-point-photo-section">
                <div className="admin-section-title-row">
                  <h3>Point Photos</h3>
                  <span className="muted">
                    {(editingPoint.photos ?? []).length} / 3
                  </span>
                </div>

                {(editingPoint.photos ?? []).length ? (
                  <div className="admin-point-photo-grid">
                    {(editingPoint.photos ?? []).map((photo, index) => (
                      <div
                        key={`${editingPoint.id}-photo-${index}`}
                        className="admin-point-photo-card"
                      >
                        <a
                          href={photo}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-point-photo-link"
                        >
                          <img
                            src={photo}
                            alt={`${editingPoint.name} photo ${index + 1}`}
                          />
                        </a>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => removePointPhoto(index)}
                        >
                          Remove Photo
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No approved photos for this point.</p>
                )}
              </div>

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

          <div className="admin-editor-section">
            <div className="admin-section-title-row">
              <h2>Inactive Points</h2>

              <button
                type="button"
                className="secondary-button small-action-button"
                onClick={() => setShowInactivePoints((current) => !current)}
              >
                {showInactivePoints ? "Hide" : "Show"}
              </button>
            </div>

            {showInactivePoints ? (
              inactivePoints.length ? (
                inactivePoints.map((point) => (
                  <div key={point.id} className="admin-point-row inactive">
                    <div>
                      <strong>{point.name}</strong>
                      <p>{point.type}</p>
                    </div>

                    <button
                      type="button"
                      className="secondary-button small-action-button"
                      onClick={() => reactivatePoint(point)}
                    >
                      Reactivate
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted">No inactive points.</p>
              )
            ) : (
              <p className="muted">
                Hidden points can be restored here.
              </p>
            )}
          </div>

          <div className="admin-editor-section">
            <h2>Outfitters</h2>

            <label className="form-label">
              Name
              <input
                value={outfitterForm.name}
                onChange={(event) =>
                  updateOutfitterForm("name", event.target.value)
                }
              />
            </label>

            <label className="form-label">
              Website
              <input
                value={outfitterForm.website}
                onChange={(event) =>
                  updateOutfitterForm("website", event.target.value)
                }
              />
            </label>

            <label className="form-label">
              Phone
              <input
                value={outfitterForm.phone}
                onChange={(event) =>
                  updateOutfitterForm("phone", event.target.value)
                }
              />
            </label>

            <label className="form-label">
              Email
              <input
                value={outfitterForm.email}
                onChange={(event) =>
                  updateOutfitterForm("email", event.target.value)
                }
              />
            </label>

            <label className="form-label">
              Description
              <textarea
                value={outfitterForm.description}
                onChange={(event) =>
                  updateOutfitterForm("description", event.target.value)
                }
              />
            </label>

            <label className="form-label">
              Highest Put-In
              <select
                value={outfitterForm.highestPutInPointId}
                onChange={(event) =>
                  updateOutfitterForm("highestPutInPointId", event.target.value)
                }
              >
                <option value="">None selected</option>
                {allAccessPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-label">
              Lowest Take-Out
              <select
                value={outfitterForm.lowestTakeOutPointId}
                onChange={(event) =>
                  updateOutfitterForm("lowestTakeOutPointId", event.target.value)
                }
              >
                <option value="">None selected</option>
                {allAccessPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="admin-outfitter-access-list">
              <strong>Access Points Used</strong>

              {allAccessPoints.map((point) => (
                <label key={point.id}>
                  <input
                    type="checkbox"
                    checked={outfitterForm.accessPointIds.includes(point.id)}
                    onChange={() => toggleOutfitterAccessPoint(point.id)}
                  />
                  {point.name}
                </label>
              ))}
            </div>

            <div className="admin-inline-actions">
              <button
                type="button"
                className="primary-button admin-save-button"
                onClick={saveOutfitter}
              >
                {editingOutfitter ? "Save Outfitter" : "Add Outfitter"}
              </button>

              {editingOutfitter ? (
                <button
                  type="button"
                  className="secondary-button admin-cancel-button"
                  onClick={resetOutfitterForm}
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <div className="admin-outfitter-list">
              {outfitters.length ? (
                outfitters.map((outfitter) => (
                  <div
                    key={outfitter.id}
                    className={`admin-outfitter-row ${
                      !outfitter.isActive ? "inactive" : ""
                    }`}
                  >
                    <div>
                      <strong>{outfitter.name}</strong>
                      <p>{outfitter.phone || outfitter.website || "No contact listed"}</p>
                      {!outfitter.isActive ? <small>Inactive</small> : null}
                    </div>

                    <div className="admin-point-actions">
                      <button
                        type="button"
                        className="secondary-button small-action-button"
                        onClick={() => startEditingOutfitter(outfitter)}
                      >
                        Edit
                      </button>

                      {outfitter.isActive ? (
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => setOutfitterActive(outfitter, false)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="secondary-button small-action-button"
                          onClick={() => setOutfitterActive(outfitter, true)}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">No outfitters listed.</p>
              )}
            </div>
          </div>

          <button className="primary-button admin-save-button" disabled={saving}>
            {saving ? "Saving..." : "Save River"}
          </button>
        </form>

        <div className="admin-editor-map-panel">
          <div className="admin-map-legend">
            <button
              type="button"
              className={!markerFilters.access ? "disabled" : ""}
              onClick={() => toggleMarkerFilter("access")}
            >
              <span className="legend-dot admin-marker-public" />
              Access
            </button>

            <button
              type="button"
              className={!markerFilters.poi ? "disabled" : ""}
              onClick={() => toggleMarkerFilter("poi")}
            >
              <span className="legend-dot admin-marker-poi" />
              POIs
            </button>

            <button
              type="button"
              className={!markerFilters.hazard ? "disabled" : ""}
              onClick={() => toggleMarkerFilter("hazard")}
            >
              <span className="legend-dot admin-marker-hazard" />
              Hazards
            </button>

            <button
              type="button"
              className={!markerFilters.newPoint ? "disabled" : ""}
              onClick={() => toggleMarkerFilter("newPoint")}
            >
              <span className="legend-dot admin-marker-new" />
              New Point
            </button>
          </div>
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

                setTimeout(() => {
                  addPointRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 50);
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

            

            {visibleEditorPoints.map((point) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={getPointIcon(point.type)}
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
            {markerFilters.newPoint && hasValidNewPointLocation ? (
              <Marker
                position={[newPointLatitude, newPointLongitude]}
                icon={newPointIcon}
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