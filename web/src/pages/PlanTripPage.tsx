import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import { useSearchParams } from "react-router-dom";

import { fetchRivers } from "../services/riverService";
import type { River, RiverPoint } from "@yakquest/shared";
import {
  getTripDistanceMiles,
  getTripTimeRange,
  getTripTimelinePoints,
} from "@yakquest/shared";
import FitRiverBounds from "../components/FitRiverBounds";
import FitTripBounds from "../components/FitTripBounds";
import { fetchSavedTrips, createSavedTrip } from "../services/savedTripService";
import { isLoggedIn } from "../services/authService";

type SelectionMode = "start" | "end";

function getAccessPoints(river: River): RiverPoint[] {
  return [
    ...river.accessPoints.public,
    ...river.accessPoints.private,
  ];
}

function getPointLabel(point: RiverPoint) {
  switch (point.type) {
    case "public_access":
      return "Public Access";

    case "private_access":
      return "Private Access";

    case "poi":
      return "Point of Interest";

    case "hazard":
      return "Hazard";

    default:
      return point.type;
  }
}

export default function PlanTripPage() {
  const {
    data: rivers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["rivers"],
    queryFn: fetchRivers,
  });

  const [selectedRiverId, setSelectedRiverId] = useState("");
  const [startId, setStartId] = useState("");
  const [endId, setEndId] = useState("");
  const [searchParams] = useSearchParams();
  const initialRiverId = searchParams.get("riverId");
  const initialSavedTripId = searchParams.get("savedTripId");
  const [savingTrip, setSavingTrip] = useState(false);
  const [tripSaved, setTripSaved] = useState(false);
  const [selectionMode, setSelectionMode] =
    useState<SelectionMode>("start");

  const selectedRiver = rivers.find(
    (river) => river.id === selectedRiverId
  );

  useEffect(() => {
    if (!initialRiverId) return;
    if (!rivers.length) return;

    const riverExists = rivers.some((river) => river.id === initialRiverId);

    if (riverExists) {
      setSelectedRiverId(initialRiverId);
    }
  }, [initialRiverId, rivers]);

  const accessPoints = selectedRiver
    ? getAccessPoints(selectedRiver)
    : [];

  const start = accessPoints.find((point) => point.id === startId);
  const end = accessPoints.find((point) => point.id === endId);

  const tripDistanceMiles = useMemo(() => {
    if (!selectedRiver || !start || !end) return 0;
    return getTripDistanceMiles(selectedRiver, start, end);
  }, [selectedRiver, start, end]);

  const tripTime = useMemo(() => {
    return getTripTimeRange(tripDistanceMiles);
  }, [tripDistanceMiles]);

  const timelinePoints = useMemo(() => {
    if (!selectedRiver || !start || !end) return [];

    return getTripTimelinePoints(selectedRiver, start, end);
  }, [selectedRiver, start, end]);

  const mapCenter: [number, number] = selectedRiver?.coordinates.length
    ? [
        selectedRiver.coordinates[0].latitude,
        selectedRiver.coordinates[0].longitude,
      ]
    : [35.1, -86.5];

  const selectPointFromMap = (point: RiverPoint) => {
    if (selectionMode === "start") {
      setStartId(point.id);

      if (!endId) {
        setSelectionMode("end");
      }

      return;
    }

    setEndId(point.id);
  };

  useEffect(() => {
    async function loadSavedTripFromUrl() {
      if (!initialSavedTripId) return;
      if (!rivers.length) return;

      const trips = await fetchSavedTrips();
      const trip = trips.find((item) => item.id === initialSavedTripId);

      if (!trip) return;

      const river = rivers.find(
        (item) =>
          item.id === trip.riverId ||
          item.name === trip.riverName
      );

      if (!river) return;

      setSelectedRiverId(river.id);

      const accessPoints = getAccessPoints(river);

      const startPoint = accessPoints.find(
        (point) =>
          point.name === trip.startName ||
          (
            point.latitude === trip.startLatitude &&
            point.longitude === trip.startLongitude
          )
      );

      const endPoint = accessPoints.find(
        (point) =>
          point.name === trip.endName ||
          (
            point.latitude === trip.endLatitude &&
            point.longitude === trip.endLongitude
          )
      );

      if (startPoint) setStartId(startPoint.id);
      if (endPoint) setEndId(endPoint.id);
    }

    loadSavedTripFromUrl();
  }, [initialSavedTripId, rivers]);

  async function savePlannedTrip() {
      if (!selectedRiver || !start || !end) {
        alert("Select a river, launch, and takeout before saving.");
        return;
      }

      if (!isLoggedIn()) {
        alert("Please log in before saving a trip.");
        return;
      }

      setSavingTrip(true);

      try {
        await createSavedTrip({
          riverId: selectedRiver.id,
          riverName: selectedRiver.name,
          name: `${selectedRiver.name}: ${start.name} to ${end.name}`,

          startName: start.name,
          startLatitude: start.latitude,
          startLongitude: start.longitude,

          endName: end.name,
          endLatitude: end.latitude,
          endLongitude: end.longitude,

          plannedDistanceMiles: tripDistanceMiles,
          estimatedTimeMin: null,

          notes: null,
        });

        setTripSaved(true);

        alert("Trip saved.");
      } catch (error) {
        console.error(error);
        alert("Failed to save trip.");
      } finally {
        setSavingTrip(false);
      }
    }

  useEffect(() => {
    setTripSaved(false);
  }, [selectedRiverId, startId, endId]);

  const clearTrip = () => {
    setStartId("");
    setEndId("");
    setSelectionMode("start");
  };

  if (isLoading) {
    return <p>Loading trip planner...</p>;
  }

  if (error) {
    return <p>Could not load rivers.</p>;
  }

  return (
    <section className="planner-workspace">
      <aside className="planner-left">
        <div className="panel-heading">
          <p className="eyebrow">Trip Planner</p>
          <h1>Choose your river</h1>
          <p className="muted">
            Select a river, then choose launch and takeout by dropdown or by
            clicking access markers on the map.
          </p>
        </div>

        <div className="river-list">
          {rivers.map((river) => {
            const selected = river.id === selectedRiverId;

            return (
              <button
                key={river.id}
                className={`river-list-item ${selected ? "selected" : ""}`}
                onClick={() => {
                  setSelectedRiverId(river.id);
                  setStartId("");
                  setEndId("");
                  setSelectionMode("start");
                }}
              >
                <span>
                  <strong>{river.name}</strong>
                  <small>{river.state}</small>
                </span>

                <span className="river-list-meta">
                  {river.accessPoints.public.length} launches
                </span>
              </button>
            );
          })}
        </div>

        {selectedRiver ? (
          <div className="planner-controls">
            <div className="selection-toggle">
              <button
                className={selectionMode === "start" ? "active" : ""}
                onClick={() => setSelectionMode("start")}
              >
                Pick Launch
              </button>
              <button
                className={selectionMode === "end" ? "active" : ""}
                onClick={() => setSelectionMode("end")}
              >
                Pick Takeout
              </button>
            </div>

            <label className="form-label">
              Launch
              <select
                value={startId}
                onChange={(event) => {
                  setStartId(event.target.value);
                  if (!endId) setSelectionMode("end");
                }}
              >
                <option value="">Select launch</option>
                {accessPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-label">
              Takeout
              <select
                value={endId}
                onChange={(event) => setEndId(event.target.value)}
              >
                <option value="">Select takeout</option>
                {accessPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.name}
                  </option>
                ))}
              </select>
            </label>

            <button className="text-button" onClick={clearTrip}>
              Clear trip
            </button>
          </div>
        ) : null}
      </aside>

      <main className="planner-center">
        <MapContainer
          key={selectedRiver?.id ?? "empty-map"}
          center={mapCenter}
          zoom={selectedRiver ? 12 : 10}
          scrollWheelZoom
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {rivers.map((river) => {
            const selected = river.id === selectedRiverId;

            return (
              <Polyline
                key={river.id}
                positions={river.coordinates.map((coord) => [
                  coord.latitude,
                  coord.longitude,
                ])}
                pathOptions={{
                  weight: selected ? 7 : 4,
                  opacity: selected ? 1 : 0.45,
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedRiverId(river.id);
                    setStartId("");
                    setEndId("");
                    setSelectionMode("start");
                  },
                }}
              />
            );
          })}

          {selectedRiver && start && end ? (
            <FitTripBounds
              river={selectedRiver}
              start={start}
              end={end}
            />
          ) : selectedRiver ? (
            <FitRiverBounds coordinates={selectedRiver.coordinates} />
          ) : null}

          {selectedRiver ? (
            <>
              {/* <Polyline
                positions={selectedRiver.coordinates.map((coord) => [
                  coord.latitude,
                  coord.longitude,
                ])}
              /> */}

              {accessPoints.map((point) => {
                const isStart = point.id === startId;
                const isEnd = point.id === endId;

                return (
                  <Marker
                    key={point.id}
                    position={[point.latitude, point.longitude]}
                    eventHandlers={{
                      click: () => selectPointFromMap(point),
                    }}
                  >
                    <Popup>
                      <strong>{point.name}</strong>
                      <br />
                      {getPointLabel(point)}
                      <br />
                      <button
                        className="popup-button"
                        onClick={() => {
                          setStartId(point.id);
                          if (!endId) setSelectionMode("end");
                        }}
                      >
                        Set as launch
                      </button>
                      <button
                        className="popup-button"
                        onClick={() => setEndId(point.id)}
                      >
                        Set as takeout
                      </button>
                      {isStart ? <p>Selected launch</p> : null}
                      {isEnd ? <p>Selected takeout</p> : null}
                    </Popup>
                  </Marker>
                );
              })}

              {selectedRiver.pois.map((point) => (
                <Marker
                  key={point.id}
                  position={[point.latitude, point.longitude]}
                >
                  <Popup>
                    <strong>{point.name}</strong>
                    <br />
                    Point of Interest
                    {point.description ? (
                      <>
                        <br />
                        {point.description}
                      </>
                    ) : null}
                  </Popup>
                </Marker>
              ))}
            </>
          ) : null}
        </MapContainer>
      </main>

      <aside className="planner-right">
        {selectedRiver ? (
          <>
            <div className="overview-card">
              <p className="eyebrow">Selected River</p>
              <h2>{selectedRiver.name}</h2>
              <p className="muted">{selectedRiver.state}</p>

              <div className="metric-grid">
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
              </div>

              {selectedRiver.usgsGaugeId ? (
                <p className="muted">
                  USGS Gauge: {selectedRiver.usgsGaugeId}
                </p>
              ) : null}
            </div>

            <div className="overview-card trip-print-area">
              <p className="eyebrow">Trip Overview</p>

              {start && end ? (
                <>
                  <h2>
                    {start.name} → {end.name}
                  </h2>

                  <div className="trip-metric">
                    <span>Distance</span>
                    <strong>{tripDistanceMiles.toFixed(2)} mi</strong>
                  </div>

                  <div className="trip-metric">
                    <span>Estimated Time</span>
                    <strong>{tripTime.label}</strong>
                  </div>

                  <div className="trip-detail-list">
                    <p>
                      <strong>Launch:</strong> {start.name}
                    </p>
                    <p>
                      <strong>Takeout:</strong> {end.name}
                    </p>
                    <p>
                      <strong>Launch Type:</strong> {getPointLabel(start)}
                    </p>
                    <p>
                      <strong>Takeout Type:</strong> {getPointLabel(end)}
                    </p>
                  </div>

                  {/* <PrintableRouteMap
                    river={selectedRiver}
                    start={start}
                    end={end}
                  /> */}

                  {timelinePoints.length > 0 ? (
                    <div className="print-section">
                      <h3>Distance Timeline</h3>

                      <div className="timeline-list">
                        {timelinePoints.map(({ point, distanceMiles, type }) => (
                          <div key={point.id} className="timeline-row">
                            <div className="timeline-distance">
                              {distanceMiles.toFixed(1)} mi
                            </div>

                            <div>
                              <strong>{point.name}</strong>
                              <p>
                                {type}
                                {point.description ? ` — ${point.description}` : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <button
                    className="primary-button button-reset"
                    onClick={() => window.print()}
                  >
                    Print Trip Plan
                  </button>

                  <button
                    type="button"
                    className="secondary-button button-reset"
                    disabled={savingTrip || tripSaved}
                    onClick={savePlannedTrip}
                  >
                    {savingTrip ? "Saving..." : tripSaved ? "Saved!" : "Save Trip"}
                  </button>
                </>
              ) : (
                <p className="muted">
                  Pick a launch and takeout to generate your trip overview.
                </p>
              )}
            </div>

            {selectedRiver.pois.length > 0 ? (
              <div className="overview-card">
                <p className="eyebrow">Points of Interest</p>

                <div className="poi-list">
                  {selectedRiver.pois.map((point) => (
                    <div key={point.id} className="poi-item">
                      <strong>{point.name}</strong>
                      {point.description ? (
                        <p>{point.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="overview-card">
            <h2>No river selected</h2>
            <p className="muted">
              Choose a river from the list to begin planning.
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}