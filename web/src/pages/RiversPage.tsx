import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";

import { fetchRivers, fetchRiverOutfitters } from "../services/riverService";
import type { River } from "@yakquest/shared";
import { fetchUSGSFlow, getFlowPercentile, getFlowRating } from "../utils/flow";
import FitRiverBounds from "../components/FitRiverBounds";

function getRiverCenter(river: River): [number, number] {
  if (!river.coordinates.length) {
    return [35.1, -86.5];
  }

  const middle = river.coordinates[Math.floor(river.coordinates.length / 2)];

  return [middle.latitude, middle.longitude];
}

function getAccessCount(river: River) {
  return river.accessPoints.public.length + river.accessPoints.private.length;
}

export default function RiversPage() {
  const {
    data: rivers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["rivers"],
    queryFn: fetchRivers,
  });

  const [selectedRiverId, setSelectedRiverId] = useState<string>("");
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);

  const [flowCfs, setFlowCfs] = useState<number | null>(null);
  const [flowLoading, setFlowLoading] = useState(false);

  const states = useMemo(() => {
    return Array.from(new Set(rivers.map((river) => river.state))).sort();
  }, [rivers]);

  const [selectedState, setSelectedState] = useState("AL");

  const filteredRivers = useMemo(() => {
    return rivers
      .filter((river) => river.state === selectedState)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rivers, selectedState]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCenter([
          position.coords.latitude,
          position.coords.longitude,
        ]);
      },
      () => {
        setUserCenter(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
      }
    );
  }, []);

  const selectedRiver = rivers.find(
    (river) => river.id === selectedRiverId
  );

  useEffect(() => {
    const gaugeId = selectedRiver?.usgsGaugeId;

    if (!gaugeId) {
      setFlowCfs(null);
      return;
    }

    let cancelled = false;

    const loadFlow = async () => {
      setFlowLoading(true);

      const flow = await fetchUSGSFlow(gaugeId);

      if (!cancelled) {
        setFlowCfs(flow);
        setFlowLoading(false);
      }
    };

    loadFlow();

    return () => {
      cancelled = true;
    };
  }, [selectedRiver?.usgsGaugeId]);

  const flowPercentile =
    flowCfs !== null && selectedRiver?.flowStats
      ? getFlowPercentile(flowCfs, selectedRiver.flowStats)
      : null;

  const flowRating = getFlowRating(flowPercentile);

  const defaultCenter: [number, number] = useMemo(() => {
    if (userCenter) return userCenter;

    if (filteredRivers.length && filteredRivers[0].coordinates.length) {
      return getRiverCenter(filteredRivers[0]);
    }

    return [35.1, -86.5];
  }, [userCenter, filteredRivers]);

  const { data: outfitters = [] } = useQuery({
    queryKey: ["riverOutfitters", selectedRiver?.id],
    queryFn: () => fetchRiverOutfitters(selectedRiver?.id ?? ""),
    enabled: !!selectedRiver?.id,
  });

  if (isLoading) {
    return <p>Loading rivers...</p>;
  }

  if (error) {
    return (
      <section>
        <h1>Rivers</h1>
        <p>Could not load rivers.</p>
        <pre className="error-box">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </section>
    );
  }

  return (
    <section className="rivers-map-page">
      <div className="rivers-map-shell">
        <MapContainer
          center={defaultCenter}
          zoom={9}
          scrollWheelZoom
          className="rivers-leaflet-map"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {selectedRiver ? (
            <FitRiverBounds coordinates={selectedRiver.coordinates} />
          ) : null}

          {userCenter ? (
            <Marker position={userCenter}>
              <Popup>Your approximate location</Popup>
            </Marker>
          ) : null}

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
                  opacity: selected ? 1 : 0.65,
                }}
                eventHandlers={{
                  click: () => setSelectedRiverId(river.id),
                }}
              />
            );
          })}

          {selectedRiver ? (
            <>
              {[
                ...selectedRiver.accessPoints.public,
                ...selectedRiver.accessPoints.private,
              ].map((point) => (
                <Marker
                  key={point.id}
                  position={[point.latitude, point.longitude]}
                >
                  <Popup>
                    <strong>{point.name}</strong>
                    <br />
                    {point.type === "public_access"
                      ? "Public Access"
                      : point.type === "private_access"
                      ? "Private Access"
                      : point.type}
                  </Popup>
                </Marker>
              ))}

              {selectedRiver.pois.map((point) => (
                <Marker
                  key={point.id}
                  position={[point.latitude, point.longitude]}
                >
                  <Popup>
                    <strong>{point.name}</strong>
                    <br />
                    Point of Interest
                  </Popup>
                </Marker>
              ))}

              {(selectedRiver.hazards ?? []).map((point) => (
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
              ))}
            </>
          ) : null}
        </MapContainer>
      </div>

      <aside className="river-detail-panel">
        {!selectedRiver ? (
          <>
            <p className="eyebrow">Explore Rivers</p>
            <h1>Choose a river</h1>
            <p className="muted">
              Click any highlighted river on the map to view details, access
              points, flow information, and planning options.
            </p>

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
                  className="river-mini-item"
                  onClick={() => setSelectedRiverId(river.id)}
                >
                  <strong>{river.name}</strong>
                  <span>{river.state}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">Selected River</p>
            <h1>{selectedRiver.name}</h1>
            <p className="muted">{selectedRiver.state}</p>

            <div className="river-detail-metrics">
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
                <span>Access Points</span>
                <strong>{getAccessCount(selectedRiver)}</strong>
              </div>
              <div>
                <span>POIs</span>
                <strong>{selectedRiver.pois.length}</strong>
              </div>
              <div>
                <span>Hazards</span>
                <strong>{selectedRiver.hazards?.length ?? 0}</strong>
              </div>
            </div>

            {selectedRiver.usgsGaugeId ? (
              <div className="river-info-card">
                <strong>USGS Gauge</strong>
                <p>{selectedRiver.usgsGaugeId}</p>
              </div>
            ) : null}

            <div className="river-info-card">
              <strong>Current Flow</strong>

              {selectedRiver.usgsGaugeId ? (
                <>
                  <p>USGS Gauge: {selectedRiver.usgsGaugeId}</p>

                  {flowLoading ? (
                    <p>Loading current flow...</p>
                  ) : flowCfs !== null ? (
                    <>
                      <p>Flow: {Math.round(flowCfs)} CFS</p>
                      <p>
                        Condition: <strong>{flowRating}</strong>
                      </p>
                    </>
                  ) : (
                    <p>Current flow unavailable.</p>
                  )}
                </>
              ) : (
                <p>No USGS gauge listed.</p>
              )}
            </div>

            {outfitters.length ? (
              <div className="river-info-card">
                <strong>Rental Outfitters</strong>

                <div className="outfitter-list">
                  {outfitters.map((outfitter) => (
                    <div key={outfitter.id} className="outfitter-card">
                      <h3>{outfitter.name}</h3>

                      {outfitter.description ? (
                        <p>{outfitter.description}</p>
                      ) : null}

                      {outfitter.phone ? (
                        <p>
                          <strong>Phone:</strong> {outfitter.phone}
                        </p>
                      ) : null}

                      {outfitter.website ? (
                        <a href={outfitter.website} target="_blank" rel="noreferrer">
                          Website
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="river-info-card">
              <strong>Public Access</strong>
              {selectedRiver.accessPoints.public.length ? (
                selectedRiver.accessPoints.public.map((point) => (
                  <p key={point.id}>{point.name}</p>
                ))
              ) : (
                <p>No public access points listed.</p>
              )}
            </div>

            {selectedRiver.pois.length ? (
              <div className="river-info-card">
                <strong>Points of Interest</strong>
                {selectedRiver.pois.map((point) => (
                  <p key={point.id}>{point.name}</p>
                ))}
              </div>
            ) : null}

            <div className="river-detail-actions">
              <a
                className="primary-button"
                href={`/plan?riverId=${selectedRiver.id}`}
              >
                Plan Trip
              </a>

              <button
                className="secondary-button river-button"
                onClick={() => setSelectedRiverId("")}
              >
                Back to All Rivers
              </button>
            </div>
          </>
        )}
      </aside>
    </section>
  );
}