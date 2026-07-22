import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { fetchRivers, fetchRiverOutfitters } from "../services/riverService";
import type {
  River,
  RiverPoint,
} from "@yakquest/shared";
import { fetchUSGSFlow, getFlowPercentile, getFlowRating } from "../utils/flow";
import FitRiverBounds from "../components/FitRiverBounds";
import CenterMapOnState from "../components/CenterMapOnState";
import { useNavigate } from "react-router-dom";
import { submitContribution } from "../services/contributionService";
import { isLoggedIn } from "../services/authService";

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

type PointMarkerType =
  | "public_access"
  | "private_access"
  | "poi"
  | "hazard";

function getRiverPointMarkerClass(type: PointMarkerType) {
  switch (type) {
    case "public_access":
      return "river-marker-public";

    case "private_access":
      return "river-marker-private";

    case "poi":
      return "river-marker-poi";

    case "hazard":
      return "river-marker-hazard";

    default:
      return "river-marker-default";
  }
}

function getRiverPointIcon(
  type: PointMarkerType,
  selected: boolean
) {
  const size = selected ? 30 : 20;
  const anchor = size / 2;

  return L.divIcon({
    className: [
      "river-map-marker",
      getRiverPointMarkerClass(type),
      selected ? "river-map-marker-selected" : "",
    ]
      .filter(Boolean)
      .join(" "),
    html: "",
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    popupAnchor: [0, -(anchor + 3)],
  });
}

type CenterMapOnPointProps = {
  point: RiverPoint | null;
};

function CenterMapOnPoint({
  point,
}: CenterMapOnPointProps) {
  const map = useMap();

  useEffect(() => {
    if (!point) return;

    const currentZoom = map.getZoom();
    const destinationZoom = Math.max(currentZoom, 14);

    map.flyTo(
      [point.latitude, point.longitude],
      destinationZoom,
      {
        animate: true,
        duration: 0.6,
      }
    );
  }, [map, point]);

  return null;
}

type PointPhotoViewer = {
  pointName: string;
  photos: string[];
  index: number;
};

type RiverPointPopupProps = {
  point: RiverPoint;
  typeLabel: string;
  onPhotoClick: (
    point: RiverPoint,
    photoIndex: number
  ) => void;
};

function RiverPointPopup({
  point,
  typeLabel,
  onPhotoClick,
}: RiverPointPopupProps) {
  const photos = point.photos ?? [];

  return (
    <div className="river-point-popup">
      <strong className="river-point-popup-name">
        {point.name}
      </strong>

      <div className="river-point-popup-type">
        {typeLabel}
      </div>

      {point.description ? (
        <p className="river-point-popup-description">
          {point.description}
        </p>
      ) : null}

      {point.parking ||
      point.restroom ||
      point.camping ? (
        <div className="river-point-popup-amenities">
          {point.parking ? (
            <span>Parking</span>
          ) : null}

          {point.restroom ? (
            <span>Restroom</span>
          ) : null}

          {point.camping ? (
            <span>Camping</span>
          ) : null}
        </div>
      ) : null}

      {point.phone ? (
        <p className="river-point-popup-contact">
          <strong>Phone:</strong>{" "}
          <a href={`tel:${point.phone}`}>
            {point.phone}
          </a>
        </p>
      ) : null}

      {point.website ? (
        <p className="river-point-popup-contact">
          <a
            href={point.website}
            target="_blank"
            rel="noreferrer"
          >
            Visit website
          </a>
        </p>
      ) : null}

      {photos.length > 0 ? (
        <div className="river-point-popup-photo-section">
          <div className="river-point-popup-photo-heading">
            {photos.length === 1
              ? "Photo"
              : `${photos.length} Photos`}
          </div>

          <div className="river-point-popup-photo-grid">
            {photos.map((photo, index) => (
              <button
                key={`${point.id}-photo-${index}`}
                type="button"
                className="river-point-popup-photo-button"
                aria-label={`View photo ${index + 1} of ${point.name}`}
                onClick={() => onPhotoClick(point, index)}
              >
                <img
                  src={photo}
                  alt={`${point.name} photo ${index + 1}`}
                  className="river-point-popup-photo"
                  loading="lazy"
                />
              </button>
            ))}
          </div>

          <div className="river-point-popup-photo-hint">
            Select a photo to enlarge it.
          </div>
        </div>
      ) : null}
    </div>
  );
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

  const navigate = useNavigate();

  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [requestedRiverName, setRequestedRiverName] = useState("");
  const [requestedRiverState, setRequestedRiverState] = useState("AL");
  const [highestAccessPoint, setHighestAccessPoint] = useState("");
  const [lowestAccessPoint, setLowestAccessPoint] = useState("");
  const [requestNotes, setRequestNotes] = useState("");

  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const [selectedRiverId, setSelectedRiverId] = useState<string>("");
  const [selectedPointId, setSelectedPointId] = useState<string>("");
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);

  const [pointFilters, setPointFilters] = useState({
    public: true,
    private: true,
    poi: true,
    hazard: true,
  });

  const [photoViewer, setPhotoViewer] = useState<PointPhotoViewer | null>(null);
  const [flowCfs, setFlowCfs] = useState<number | null>(null);
  const [flowLoading, setFlowLoading] = useState(false);

  const states = useMemo(() => {
    return Array.from(new Set(rivers.map((river) => river.state))).sort();
  }, [rivers]);

  const [selectedState, setSelectedState] = useState("AL");

  useEffect(() => {
    if (!requestFormOpen) {
      setRequestedRiverState(selectedState);
    }
  }, [requestFormOpen, selectedState]);

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

  const selectedPoint = useMemo(() => {
    if (!selectedRiver || !selectedPointId) {
      return null;
    }

    const allPoints = [
      ...selectedRiver.accessPoints.public,
      ...selectedRiver.accessPoints.private,
      ...selectedRiver.pois,
      ...(selectedRiver.hazards ?? []),
    ];

    return (
      allPoints.find(
        (point) => point.id === selectedPointId
      ) ?? null
    );
  }, [selectedRiver, selectedPointId]);

  function togglePointFilter(
    filter: keyof typeof pointFilters
  ) {
    setPointFilters((current) => {
      const nextEnabled = !current[filter];

      if (!nextEnabled && selectedPoint) {
        const selectedPointFilter =
          selectedPoint.type === "public_access"
            ? "public"
            : selectedPoint.type === "private_access"
              ? "private"
              : selectedPoint.type === "poi"
                ? "poi"
                : selectedPoint.type === "hazard"
                  ? "hazard"
                  : null;

        if (selectedPointFilter === filter) {
          setSelectedPointId("");
        }
      }

      return {
        ...current,
        [filter]: nextEnabled,
      };
    });
  }

  useEffect(() => {
    setSelectedPointId("");
    setPhotoViewer(null);
  }, [selectedRiverId]);

  useEffect(() => {
    if (!photoViewer) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPhotoViewer(null);
      }

      if (
        event.key === "ArrowLeft" &&
        photoViewer.photos.length > 1
      ) {
        setPhotoViewer((current) => {
          if (!current) return null;

          return {
            ...current,
            index:
              (current.index - 1 + current.photos.length) %
              current.photos.length,
          };
        });
      }

      if (
        event.key === "ArrowRight" &&
        photoViewer.photos.length > 1
      ) {
        setPhotoViewer((current) => {
          if (!current) return null;

          return {
            ...current,
            index:
              (current.index + 1) %
              current.photos.length,
          };
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [photoViewer]);

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

  const closeRiverRequestForm = () => {
    if (requestSubmitting) return;

    setRequestFormOpen(false);
    setRequestError("");
    setRequestSubmitted(false);
  };

  const submitRiverRequest = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isLoggedIn()) {
      navigate("/login", {
        state: {
          returnTo: "/rivers",
          message: "Please log in to request a new river.",
        },
      });

      return;
    }

    const riverName = requestedRiverName.trim();
    const state = requestedRiverState.trim().toUpperCase();
    const highest = highestAccessPoint.trim();
    const lowest = lowestAccessPoint.trim();
    const notes = requestNotes.trim();

    if (!riverName) {
      setRequestError("Enter the river name.");
      return;
    }

    if (!state) {
      setRequestError("Select a state.");
      return;
    }

    if (!highest || !lowest) {
      setRequestError(
        "Please provide the highest and lowest known access points."
      );
      return;
    }

    const description = [
      `Highest known access point: ${highest}`,
      `Lowest known access point: ${lowest}`,
      notes ? `Additional details: ${notes}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    setRequestSubmitting(true);
    setRequestError("");

    try {
      await submitContribution({
        kind: "new-river",
        riverName,
        state,
        description,
        points: [],
      });

      setRequestSubmitted(true);
      setRequestedRiverName("");
      setHighestAccessPoint("");
      setLowestAccessPoint("");
      setRequestNotes("");
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to submit the river request."
      );
    } finally {
      setRequestSubmitting(false);
    }
  };

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
        {selectedRiver ? (
          <div
            className="rivers-map-legend"
            aria-label="Map point filters"
          >
            <button
              type="button"
              className={
                pointFilters.public ? "" : "disabled"
              }
              onClick={() => togglePointFilter("public")}
              aria-pressed={pointFilters.public}
            >
              <span className="river-legend-dot river-marker-public" />
              Public
            </button>

            <button
              type="button"
              className={
                pointFilters.private ? "" : "disabled"
              }
              onClick={() => togglePointFilter("private")}
              aria-pressed={pointFilters.private}
            >
              <span className="river-legend-dot river-marker-private" />
              Private
            </button>

            <button
              type="button"
              className={
                pointFilters.poi ? "" : "disabled"
              }
              onClick={() => togglePointFilter("poi")}
              aria-pressed={pointFilters.poi}
            >
              <span className="river-legend-dot river-marker-poi" />
              POI
            </button>

            <button
              type="button"
              className={
                pointFilters.hazard ? "" : "disabled"
              }
              onClick={() => togglePointFilter("hazard")}
              aria-pressed={pointFilters.hazard}
            >
              <span className="river-legend-dot river-marker-hazard" />
              Hazard
            </button>
          </div>
        ) : null}

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

          <CenterMapOnState
            state={selectedState}
            enabled={!selectedRiver}
          />

          {selectedRiver ? (
            <FitRiverBounds coordinates={selectedRiver.coordinates} />
          ) : null}

          <CenterMapOnPoint point={selectedPoint} />

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
              {pointFilters.public
                ? selectedRiver.accessPoints.public.map(
                    (point) => (
                      <Marker
                        key={point.id}
                        position={[
                          point.latitude,
                          point.longitude,
                        ]}
                        icon={getRiverPointIcon(
                          "public_access",
                          selectedPointId === point.id
                        )}
                        zIndexOffset={
                          selectedPointId === point.id
                            ? 1000
                            : 0
                        }
                        eventHandlers={{
                          click: () =>
                            setSelectedPointId(point.id),
                        }}
                      >
                        <Popup
                          minWidth={240}
                          maxWidth={340}
                        >
                          <RiverPointPopup
                            point={point}
                            typeLabel="Public Access"
                            onPhotoClick={(
                              selectedPhotoPoint,
                              photoIndex
                            ) => {
                              setPhotoViewer({
                                pointName:
                                  selectedPhotoPoint.name,
                                photos:
                                  selectedPhotoPoint.photos ?? [],
                                index: photoIndex,
                              });
                            }}
                          />
                        </Popup>
                      </Marker>
                    )
                  )
                : null}

              {pointFilters.private
                ? selectedRiver.accessPoints.private.map(
                    (point) => (
                      <Marker
                        key={point.id}
                        position={[
                          point.latitude,
                          point.longitude,
                        ]}
                        icon={getRiverPointIcon(
                          "private_access",
                          selectedPointId === point.id
                        )}
                        zIndexOffset={
                          selectedPointId === point.id
                            ? 1000
                            : 0
                        }
                        eventHandlers={{
                          click: () =>
                            setSelectedPointId(point.id),
                        }}
                      >
                        <Popup
                          minWidth={240}
                          maxWidth={340}
                        >
                          <RiverPointPopup
                            point={point}
                            typeLabel="Private Access"
                            onPhotoClick={(
                              selectedPhotoPoint,
                              photoIndex
                            ) => {
                              setPhotoViewer({
                                pointName:
                                  selectedPhotoPoint.name,
                                photos:
                                  selectedPhotoPoint.photos ?? [],
                                index: photoIndex,
                              });
                            }}
                          />
                        </Popup>
                      </Marker>
                    )
                  )
                : null}

              {pointFilters.poi
                ? selectedRiver.pois.map((point) => (
                    <Marker
                      key={point.id}
                      position={[
                        point.latitude,
                        point.longitude,
                      ]}
                      icon={getRiverPointIcon(
                        "poi",
                        selectedPointId === point.id
                      )}
                      zIndexOffset={
                        selectedPointId === point.id
                          ? 1000
                          : 0
                      }
                      eventHandlers={{
                        click: () =>
                          setSelectedPointId(point.id),
                      }}
                    >
                      <Popup
                        minWidth={240}
                        maxWidth={340}
                      >
                        <RiverPointPopup
                          point={point}
                          typeLabel="Point of Interest"
                          onPhotoClick={(
                            selectedPhotoPoint,
                            photoIndex
                          ) => {
                            setPhotoViewer({
                              pointName:
                                selectedPhotoPoint.name,
                              photos:
                                selectedPhotoPoint.photos ?? [],
                              index: photoIndex,
                            });
                          }}
                        />
                      </Popup>
                    </Marker>
                  ))
                : null}

              {pointFilters.hazard
                ? (selectedRiver.hazards ?? []).map(
                    (point) => (
                      <Marker
                        key={point.id}
                        position={[
                          point.latitude,
                          point.longitude,
                        ]}
                        icon={getRiverPointIcon(
                          "hazard",
                          selectedPointId === point.id
                        )}
                        zIndexOffset={
                          selectedPointId === point.id
                            ? 1000
                            : 0
                        }
                        eventHandlers={{
                          click: () =>
                            setSelectedPointId(point.id),
                        }}
                      >
                        <Popup
                          minWidth={240}
                          maxWidth={340}
                        >
                          <RiverPointPopup
                            point={point}
                            typeLabel="Hazard"
                            onPhotoClick={(
                              selectedPhotoPoint,
                              photoIndex
                            ) => {
                              setPhotoViewer({
                                pointName:
                                  selectedPhotoPoint.name,
                                photos:
                                  selectedPhotoPoint.photos ?? [],
                                index: photoIndex,
                              });
                            }}
                          />
                        </Popup>
                      </Marker>
                    )
                  )
                : null}
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
              points, flow information, and planning options, or choose from the
              lists below.
            </p>

            <button
              type="button"
              className="request-river-button"
              onClick={() => {
                setRequestedRiverState(selectedState);
                setRequestError("");
                setRequestSubmitted(false);
                setRequestFormOpen(true);
              }}
            >
              Request a New River
            </button>

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

      {requestFormOpen ? (
        <div
          className="river-request-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRiverRequestForm();
            }
          }}
        >
          <div
            className="river-request-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="river-request-title"
          >
            <div className="river-request-modal-header">
              <div>
                <p className="eyebrow">River Contribution</p>
                <h2 id="river-request-title">
                  Request a New River
                </h2>
              </div>

              <button
                type="button"
                className="river-request-modal-close"
                onClick={closeRiverRequestForm}
                aria-label="Close request form"
              >
                ×
              </button>
            </div>

            {requestSubmitted ? (
              <div className="river-request-success">
                <h3>Request submitted</h3>
                <p>
                  Thank you. The river request has been sent for review.
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={closeRiverRequestForm}
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                className="river-request-form"
                onSubmit={submitRiverRequest}
              >
                <p className="muted">
                  Tell us the river and the highest and lowest access
                  points you know. This helps us determine the section
                  needed when building the river map.
                </p>

                <label className="form-label">
                  River name
                  <input
                    type="text"
                    value={requestedRiverName}
                    onChange={(event) =>
                      setRequestedRiverName(event.target.value)
                    }
                    placeholder="Example: Paint Rock River"
                    maxLength={255}
                    required
                  />
                </label>

                <label className="form-label">
                  State
                  <select
                    value={requestedRiverState}
                    onChange={(event) =>
                      setRequestedRiverState(event.target.value)
                    }
                    required
                  >
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-label">
                  Highest known access point
                  <textarea
                    value={highestAccessPoint}
                    onChange={(event) =>
                      setHighestAccessPoint(event.target.value)
                    }
                    placeholder="Name, road, bridge, park, town, or approximate location"
                    rows={3}
                    required
                  />
                </label>

                <label className="form-label">
                  Lowest known access point
                  <textarea
                    value={lowestAccessPoint}
                    onChange={(event) =>
                      setLowestAccessPoint(event.target.value)
                    }
                    placeholder="Name, road, bridge, park, town, or approximate location"
                    rows={3}
                    required
                  />
                </label>

                <label className="form-label">
                  Additional details
                  <textarea
                    value={requestNotes}
                    onChange={(event) =>
                      setRequestNotes(event.target.value)
                    }
                    placeholder="Optional notes about the requested section"
                    rows={4}
                  />
                </label>

                {requestError ? (
                  <p className="river-request-error">
                    {requestError}
                  </p>
                ) : null}

                <div className="river-request-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeRiverRequestForm}
                    disabled={requestSubmitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={requestSubmitting}
                  >
                    {requestSubmitting
                      ? "Submitting..."
                      : "Submit River Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
      {photoViewer &&
        photoViewer.photos[photoViewer.index] ? (
          <div
            className="river-photo-viewer-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`${photoViewer.pointName} photo viewer`}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setPhotoViewer(null);
              }
            }}
          >
            <div className="river-photo-viewer">
              <div className="river-photo-viewer-header">
                <div>
                  <strong>{photoViewer.pointName}</strong>

                  <span>
                    Photo {photoViewer.index + 1} of{" "}
                    {photoViewer.photos.length}
                  </span>
                </div>

                <button
                  type="button"
                  className="river-photo-viewer-close"
                  onClick={() => setPhotoViewer(null)}
                  aria-label="Close photo viewer"
                >
                  ×
                </button>
              </div>

              <div className="river-photo-viewer-image-area">
                <img
                  src={photoViewer.photos[photoViewer.index]}
                  alt={`${photoViewer.pointName} photo ${
                    photoViewer.index + 1
                  }`}
                  className="river-photo-viewer-image"
                />
              </div>

              {photoViewer.photos.length > 1 ? (
                <div className="river-photo-viewer-controls">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setPhotoViewer((current) => {
                        if (!current) return null;

                        return {
                          ...current,
                          index:
                            (current.index -
                              1 +
                              current.photos.length) %
                            current.photos.length,
                        };
                      });
                    }}
                  >
                    ← Previous
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setPhotoViewer((current) => {
                        if (!current) return null;

                        return {
                          ...current,
                          index:
                            (current.index + 1) %
                            current.photos.length,
                        };
                      });
                    }}
                  >
                    Next →
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
    </section>
  );
}