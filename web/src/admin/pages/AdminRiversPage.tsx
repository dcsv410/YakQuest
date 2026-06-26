import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";

import { fetchRivers } from "../../services/riverService";
import type { River } from "@yakquest/shared";
import FitRiverBounds from "../../components/FitRiverBounds";

function getAccessPoints(river: River) {
  return [
    ...river.accessPoints.public,
    ...river.accessPoints.private,
  ];
}

export default function AdminRiversPage() {
  const { data: rivers = [], isLoading, error } = useQuery({
    queryKey: ["rivers"],
    queryFn: fetchRivers,
  });

  const states = useMemo(() => {
    return Array.from(new Set(rivers.map((river) => river.state))).sort();
  }, [rivers]);

  const [selectedState, setSelectedState] = useState("AL");
  const [selectedRiverId, setSelectedRiverId] = useState("");

  const filteredRivers = useMemo(() => {
    return rivers
      .filter((river) => river.state === selectedState)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rivers, selectedState]);

  const selectedRiver = rivers.find(
    (river) => river.id === selectedRiverId
  );

  const mapCenter: [number, number] =
    selectedRiver?.coordinates.length
      ? [
          selectedRiver.coordinates[0].latitude,
          selectedRiver.coordinates[0].longitude,
        ]
      : [35.1, -86.5];

  if (isLoading) {
    return <p>Loading rivers...</p>;
  }

  if (error) {
    return <p>Unable to load rivers.</p>;
  }

  return (
    <section className="admin-rivers-page">
      <aside className="admin-rivers-list-panel">
        <p className="eyebrow">Admin</p>
        <h1>Rivers</h1>

        <label className="form-label">
          State
          <select
            value={selectedState}
            onChange={(event) => {
              setSelectedState(event.target.value);
              setSelectedRiverId("");
            }}
          >
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>

        <div className="river-mini-list">
          {filteredRivers.map((river) => (
            <button
              key={river.id}
              className={`river-mini-item ${
                river.id === selectedRiverId ? "selected" : ""
              }`}
              onClick={() => setSelectedRiverId(river.id)}
            >
              <strong>{river.name}</strong>
              <span>
                {river.accessPoints.public.length} public access ·{" "}
                {river.pois.length} POIs
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div className="admin-rivers-map-panel">
        <MapContainer
          key={selectedRiver?.id ?? selectedState}
          center={mapCenter}
          zoom={selectedRiver ? 12 : 8}
          scrollWheelZoom
          className="admin-rivers-map"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {selectedRiver ? (
            <FitRiverBounds coordinates={selectedRiver.coordinates} />
          ) : null}

          {filteredRivers.map((river) => (
            <Polyline
              key={river.id}
              positions={river.coordinates.map((coord) => [
                coord.latitude,
                coord.longitude,
              ])}
              pathOptions={{
                weight: river.id === selectedRiverId ? 7 : 4,
                opacity: river.id === selectedRiverId ? 1 : 0.5,
              }}
              eventHandlers={{
                click: () => setSelectedRiverId(river.id),
              }}
            />
          ))}

          {selectedRiver
            ? getAccessPoints(selectedRiver).map((point) => (
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
              ))
            : null}

          {selectedRiver
            ? selectedRiver.pois.map((point) => (
                <Marker
                  key={point.id}
                  position={[point.latitude, point.longitude]}
                >
                  <Popup>
                    <strong>{point.name}</strong>
                    <br />
                    POI
                  </Popup>
                </Marker>
              ))
            : null}

          {selectedRiver
            ? (selectedRiver.hazards ?? []).map((point) => (
                <Marker
                  key={point.id}
                  position={[point.latitude, point.longitude]}
                >
                  <Popup>
                    <strong>{point.name}</strong>
                    <br />
                    Hazard
                  </Popup>
                </Marker>
              ))
            : null}
        </MapContainer>
      </div>

      <aside className="admin-river-detail-panel">
        {selectedRiver ? (
          <>
            <p className="eyebrow">Selected River</p>
            <h2>{selectedRiver.name}</h2>
            <p className="muted">{selectedRiver.state}</p>

            <div className="admin-detail-grid">
              <div>
                <span>Difficulty</span>
                <strong>{selectedRiver.difficulty}/5</strong>
              </div>
              <div>
                <span>Cleanliness</span>
                <strong>{selectedRiver.cleanliness}/5</strong>
              </div>
              <div>
                <span>Fishing</span>
                <strong>{selectedRiver.fishing}/5</strong>
              </div>
              <div>
                <span>Gauge</span>
                <strong>{selectedRiver.usgsGaugeId || "None"}</strong>
              </div>
            </div>

            <Link
              className="primary-button admin-action-button admin-link-button"
              to={`/admin/rivers/${selectedRiver.id}/edit`}
            >
              Edit River
            </Link>

            <button className="secondary-button admin-action-button">
              Upload / Replace KML
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow">River Manager</p>
            <h2>Select a river</h2>
            <p className="muted">
              Choose a river from the list or click a river on the map.
            </p>
          </>
        )}
      </aside>
    </section>
  );
}