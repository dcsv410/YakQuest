import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { divIcon, Icon } from "leaflet";
import L from "leaflet";
import { useSearchParams } from "react-router-dom";

import { fetchRivers } from "../services/riverService";
import type { River, RiverPoint } from "@yakquest/shared";
import { getTripDistanceMiles, getTripTimeRange, getTripTimelinePoints } from "@yakquest/shared";
import FitRiverBounds from "../components/FitRiverBounds";
import FitTripBounds from "../components/FitTripBounds";
import CenterMapOnState from "../components/CenterMapOnState";
import { fetchSavedTrips, createSavedTrip } from "../services/savedTripService";
import { getStoredUser, isLoggedIn } from "../services/authService";
import { fetchUSGSFlow, getFlowPercentile, getFlowRating } from "../utils/flow";
import { fetchRiverOutfitters } from "../services/riverService";
import PrintableRouteMap from "../components/PrintableRouteMap";
import { fetchTripWeather, type TripWeather } from "../services/weatherService";
import { sendTripPlanEmail } from "../services/tripPlanService";

type SelectionMode = "start" | "end";

type PointFilters = {
  publicAccess: boolean;
  privateAccess: boolean;
  poi: boolean;
  hazard: boolean;
};

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

function getPlannerMarkerClass(
  point: RiverPoint,
  isStart: boolean,
  isEnd: boolean
): string {
  if (isStart) {
    return "planner-marker-start";
  }

  if (isEnd) {
    return "planner-marker-end";
  }

  switch (point.type) {
    case "public_access":
      return "planner-marker-public";

    case "private_access":
      return "planner-marker-private";

    case "poi":
      return "planner-marker-poi";

    case "hazard":
      return "planner-marker-hazard";

    default:
      return "planner-marker-default";
  }
}

function getPlannerPointIcon(
  point: RiverPoint,
  isStart = false,
  isEnd = false
) {
  const selected =
    isStart || isEnd;

  const size = selected ? 28 : 20;

  return L.divIcon({
    className: [
      "planner-map-marker",
      getPlannerMarkerClass(
        point,
        isStart,
        isEnd
      ),
      selected
        ? "planner-map-marker-selected"
        : "",
    ]
      .filter(Boolean)
      .join(" "),

    html: "",

    iconSize: [size, size],

    iconAnchor: [
      size / 2,
      size / 2,
    ],

    popupAnchor: [
      0,
      -(size / 2),
    ],
  });
}

const HUNTSVILLE_CENTER: [number, number] = [34.7304, -86.5861];

// const defaultAccessPointIcon =
//   new Icon.Default();

// const selectedLaunchIcon = divIcon({
//   className: "selected-trip-marker-wrapper",
//   html: `
//     <div class="selected-trip-marker selected-trip-marker-launch">
//       L
//     </div>
//   `,
//   iconSize: [36, 36],
//   iconAnchor: [18, 18],
//   popupAnchor: [0, -20],
// });

// const selectedTakeoutIcon = divIcon({
//   className: "selected-trip-marker-wrapper",
//   html: `
//     <div class="selected-trip-marker selected-trip-marker-takeout">
//       T
//     </div>
//   `,
//   iconSize: [36, 36],
//   iconAnchor: [18, 18],
//   popupAnchor: [0, -20],
// });

export default function PlanTripPage() {
  const {
    data: rivers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["rivers"],
    queryFn: fetchRivers,
  });

  const [printMode, setPrintMode] = useState(false);
  const [selectedRiverId, setSelectedRiverId] = useState("");
  const [startId, setStartId] = useState("");
  const [endId, setEndId] = useState("");
  const [searchParams] = useSearchParams();
  const initialRiverId = searchParams.get("riverId");
  const initialSavedTripId = searchParams.get("savedTripId");
  const [savingTrip, setSavingTrip] = useState(false);
  const [tripSaved, setTripSaved] = useState(false);
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);
  const [selectedState, setSelectedState] = useState("AL");
  const [flowCfs, setFlowCfs] = useState<number | null>(null);
  const [flowLoading, setFlowLoading] = useState(false);
  const [plannedLaunchDateTime, setPlannedLaunchDateTime] = useState("");
  const [tripWeather, setTripWeather] = useState<TripWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] =
    useState<SelectionMode>("start");

  const [
    pointFilters,
    setPointFilters,
  ] = useState<PointFilters>({
    publicAccess: true,
    privateAccess: true,
    poi: true,
    hazard: true,
  });

  const selectedRiver = rivers.find(
    (river) => river.id === selectedRiverId
  );

  const states = useMemo(() => {
    return Array.from(new Set(rivers.map((river) => river.state))).sort();
  }, [rivers]);

  const filteredRivers = useMemo(() => {
    return rivers
      .filter((river) => river.state === selectedState)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rivers, selectedState]);

  const storedUser = getStoredUser();

  const [
    emailTripDialogOpen,
    setEmailTripDialogOpen,
  ] = useState(false);

  const [
    emailRecipientMode,
    setEmailRecipientMode,
  ] = useState<
    "account" | "manual"
  >(
    storedUser ? "account" : "manual"
  );

  const [
    manualEmailAddress,
    setManualEmailAddress,
  ] = useState("");

  const [
    emailingTripPlan,
    setEmailingTripPlan,
  ] = useState(false);

  const [
    emailTripError,
    setEmailTripError,
  ] = useState("");

  const [
    emailTripSuccess,
    setEmailTripSuccess,
  ] = useState("");

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

  const allMapPoints = useMemo(
    () => {
      if (!selectedRiver) {
        return [];
      }

      return [
        ...selectedRiver
          .accessPoints.public,

        ...selectedRiver
          .accessPoints.private,

        ...selectedRiver.pois,

        ...(selectedRiver.hazards ?? []),
      ];
    },
    [selectedRiver]
  );

  const start = accessPoints.find((point) => point.id === startId);
  const end = accessPoints.find((point) => point.id === endId);

  const visibleMapPoints = useMemo(
    () => {
      return allMapPoints.filter(
        (point) => {
          /*
          * Always keep the selected launch
          * and takeout visible.
          */
          if (
            point.id === startId ||
            point.id === endId
          ) {
            return true;
          }

          switch (point.type) {
            case "public_access":
              return (
                pointFilters.publicAccess
              );

            case "private_access":
              return (
                pointFilters.privateAccess
              );

            case "poi":
              return pointFilters.poi;

            case "hazard":
              return pointFilters.hazard;

            default:
              return true;
          }
        }
      );
    },
    [
      allMapPoints,
      startId,
      endId,
      pointFilters,
    ]
  );

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
    : userCenter ?? HUNTSVILLE_CENTER;

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

  function togglePointFilter(
    filter:
      keyof PointFilters
  ) {
    setPointFilters((current) => ({
      ...current,
      [filter]: !current[filter],
    }));
  }

  function showAllPointTypes() {
    setPointFilters({
      publicAccess: true,
      privateAccess: true,
      poi: true,
      hazard: true,
    });
  }

  const { data: outfitters = [] } = useQuery({
    queryKey: ["riverOutfitters", selectedRiver?.id],
    queryFn: () => fetchRiverOutfitters(selectedRiver?.id ?? ""),
    enabled: !!selectedRiver?.id,
  });

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

  useEffect(() => {
    if (!selectedRiver?.usgsGaugeId) {
      setFlowCfs(null);
      setFlowLoading(false);
      return;
    }

    const gaugeId = selectedRiver.usgsGaugeId;
    let cancelled = false;

    async function loadFlow() {
      setFlowLoading(true);

      const flow = await fetchUSGSFlow(gaugeId);

      if (!cancelled) {
        setFlowCfs(flow);
        setFlowLoading(false);
      }
    }

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

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      if (!start || !plannedLaunchDateTime) {
        setTripWeather(null);
        setWeatherError(null);
        setWeatherLoading(false);
        return;
      }

      setWeatherLoading(true);
      setWeatherError(null);

      try {
        const weather = await fetchTripWeather(start, plannedLaunchDateTime);

        if (!cancelled) {
          setTripWeather(weather);
        }
      } catch (error) {
        console.error("Failed to load trip weather", error);

        if (!cancelled) {
          setTripWeather(null);
          setWeatherError("Weather forecast unavailable.");
        }
      } finally {
        if (!cancelled) {
          setWeatherLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [start, plannedLaunchDateTime]);

  function getTripPlanFileName() {
    if (!selectedRiver) return "yakquest_trip.pdf";

    const date =
      plannedLaunchDateTime ||
      new Date().toISOString().split("T")[0];

    const formattedDate = date.split("T")[0];

    return `${selectedRiver.name}_trip_${formattedDate}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") + ".pdf";
  }

  function waitForPrintRender() {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }

  async function createTripPdfBlob():
    Promise<Blob> {
    if (
      !selectedRiver ||
      !start ||
      !end
    ) {
      throw new Error(
        "Select a launch and takeout first."
      );
    }

    setPrintMode(true);

    await waitForPrintRender();

    const printArea =
      document.querySelector(
        ".trip-print-area"
      ) as HTMLElement | null;

    if (!printArea) {
      setPrintMode(false);

      throw new Error(
        "The printable trip plan "
        + "could not be found."
      );
    }

    try {
      const html2pdfModule =
        await import(
          "html2pdf.js"
        );

      const html2pdf =
        html2pdfModule.default as any;

      const worker = html2pdf()
        .set({
          margin: 0.25,
          filename:
            getTripPlanFileName(),
          image: {
            type: "jpeg",
            quality: 0.98,
          },
          html2canvas: {
            scale: 2,
            useCORS: true,
          },
          jsPDF: {
            unit: "in",
            format: "letter",
            orientation: "portrait",
          },
          pagebreak: {
            mode: [
              "avoid-all",
              "css",
              "legacy",
            ],
          },
        } as any)
        .from(printArea)
        .toPdf();

      return await worker.outputPdf(
        "blob"
      );
    } finally {
      setPrintMode(false);
    }
  }


  async function downloadTripPdf() {
    try {
      const pdfBlob =
        await createTripPdfBlob();

      const objectUrl =
        URL.createObjectURL(
          pdfBlob
        );

      const downloadLink =
        document.createElement("a");

      downloadLink.href =
        objectUrl;

      downloadLink.download =
        getTripPlanFileName();

      document.body.appendChild(
        downloadLink
      );

      downloadLink.click();
      downloadLink.remove();

      URL.revokeObjectURL(
        objectUrl
      );
    } catch (error) {
      console.error(
        "Unable to generate trip PDF:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to generate the PDF."
      );
    }
  }

  function openEmailTripDialog() {
    setEmailTripError("");
    setEmailTripSuccess("");

    setEmailRecipientMode(
      storedUser
        ? "account"
        : "manual"
    );

    setEmailTripDialogOpen(true);
  }


  function closeEmailTripDialog() {
    if (emailingTripPlan) {
      return;
    }

    setEmailTripDialogOpen(false);
    setEmailTripError("");
    setEmailTripSuccess("");
  }


  function isValidEmail(
    email: string
  ) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }


  async function emailTripPlan() {
    if (
      !selectedRiver ||
      !start ||
      !end
    ) {
      return;
    }

    const recipientEmail =
      emailRecipientMode === "account"
        ? storedUser?.email ?? ""
        : manualEmailAddress
            .trim()
            .toLowerCase();

    if (!recipientEmail) {
      setEmailTripError(
        "Enter an email address."
      );

      return;
    }

    if (
      !isValidEmail(
        recipientEmail
      )
    ) {
      setEmailTripError(
        "Enter a valid email address."
      );

      return;
    }

    setEmailingTripPlan(true);
    setEmailTripError("");
    setEmailTripSuccess("");

    try {
      const pdfBlob =
        await createTripPdfBlob();

      await sendTripPlanEmail({
        recipientEmail,
        riverName:
          selectedRiver.name,
        state:
          selectedRiver.state,
        launchName:
          start.name,
        takeoutName:
          end.name,
        distanceMiles:
          tripDistanceMiles,
        estimatedTime:
          tripTime.label,
        plannedLaunch:
          plannedLaunchDateTime
            ? new Date(
                plannedLaunchDateTime
              ).toLocaleString()
            : null,
        pdfBlob,
        pdfFilename:
          getTripPlanFileName(),
      });

      setEmailTripSuccess(
        `Trip plan sent to ${recipientEmail}.`
      );
    } catch (error) {
      console.error(
        "Unable to email trip plan:",
        error
      );

      setEmailTripError(
        error instanceof Error
          ? error.message
          : (
              "Unable to email the "
              + "trip plan."
            )
      );
    } finally {
      setEmailingTripPlan(false);
    }
  }

  function printTripPlan() {
    setPrintMode(true);

    setTimeout(() => {
      const printArea = document.querySelector(
        ".trip-print-area"
      ) as HTMLElement | null;

      if (!printArea) {
        setPrintMode(false);
        return;
      }

      const clonedPrintArea = printArea.cloneNode(true) as HTMLElement;

      const originalCanvases = printArea.querySelectorAll("canvas");
      const clonedCanvases = clonedPrintArea.querySelectorAll("canvas");

      originalCanvases.forEach((canvas, index) => {
        const clonedCanvas = clonedCanvases[index];
        if (!clonedCanvas) return;

        const image = document.createElement("img");
        image.src = (canvas as HTMLCanvasElement).toDataURL("image/png");
        image.className = clonedCanvas.className;
        image.alt =
          clonedCanvas.getAttribute("aria-label") ?? "Route map";

        clonedCanvas.replaceWith(image);
      });

      const printWindow = window.open("", "_blank", "width=1000,height=800");

      if (!printWindow) {
        setPrintMode(false);
        alert("Popup blocked. Please allow popups to print the trip plan.");
        return;
      }

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>YakQuest Trip Plan</title>
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                margin: 0;
                padding: 0.25in;
                color: #10201c;
                background: white;
              }

              .no-print,
              .button-reset {
                display: none !important;
              }

              .trip-print-layout {
                display: grid;
                grid-template-columns: 1fr 3.5in;
                gap: 0.25in;
                align-items: start;
              }

              .trip-metric,
              .metric-grid div {
                border-radius: 14px;
                background: #f4f7f3;
                padding: 12px;
                margin-top: 10px;
              }

              .trip-metric span {
                display: block;
                font-size: 12px;
                color: #64756f;
                font-weight: 800;
                text-transform: uppercase;
              }

              .trip-metric strong {
                display: block;
                margin-top: 4px;
                font-size: 18px;
              }

              .trip-detail-list p {
                margin: 8px 0;
              }

              .print-section {
                margin-top: 24px;
                border-top: 1px solid rgba(16, 32, 28, 0.12);
                padding-top: 16px;
              }

              .timeline-row {
                display: grid;
                grid-template-columns: 70px 1fr;
                gap: 12px;
                padding: 10px 0;
                border-top: 1px solid rgba(16, 32, 28, 0.12);
                break-inside: avoid;
              }

              .timeline-distance {
                font-weight: 900;
                color: #147473;
              }

              .print-route-map {
                width: 100%;
                height: 9in;
                border: 1px solid #ddd;
                border-radius: 14px;
              }

              .print-map-bg {
                fill: #f3faf9;
                stroke: rgba(28, 167, 166, 0.28);
                stroke-width: 2;
              }

              .print-route-line {
                fill: none;
                stroke: #1ca7a6;
                stroke-width: 5;
                stroke-linecap: round;
                stroke-linejoin: round;
              }

              .print-marker-start { fill: #18a558; stroke: white; stroke-width: 2; }
              .print-marker-end { fill: #d64545; stroke: white; stroke-width: 2; }
              .print-marker-poi { fill: #3468c9; stroke: white; stroke-width: 2; }
              .print-marker-hazard { fill: #9f1d1d; stroke: white; stroke-width: 2; }

              .print-map-label {
                font-size: 12px;
                font-weight: 700;
                fill: #10201c;
              }
            </style>
          </head>
          <body>
            ${clonedPrintArea.innerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();

      printWindow.focus();
      printWindow.print();

      printWindow.close();
      setPrintMode(false);
    }, 100);
  }

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

        {!selectedRiver ? (
          <>
            <label className="form-label">
              State
              <select
                value={selectedState}
                onChange={(event) => {
                  setSelectedState(event.target.value);
                  setSelectedRiverId("");
                  setStartId("");
                  setEndId("");
                  setSelectionMode("start");
                }}
              >
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>

            <div className="river-list">
              {filteredRivers.map((river) => {
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
          </>
        ) : null}

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

            <p className="muted">
              You may select launch and takeout from the dropdowns below or by clicking
              access points on the map.
            </p>

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
        {selectedRiver ? (
          <div
            className="planner-map-legend"
            aria-label="Map point filters"
          >
            <div className="planner-map-legend-heading">
              <strong>Map Points</strong>

              <button
                type="button"
                className="planner-map-legend-reset"
                onClick={showAllPointTypes}
              >
                Show All
              </button>
            </div>

            <div className="planner-map-legend-options">
              <button
                type="button"
                className={
                  pointFilters.publicAccess
                    ? "active"
                    : "disabled"
                }
                aria-pressed={
                  pointFilters.publicAccess
                }
                onClick={() =>
                  togglePointFilter(
                    "publicAccess"
                  )
                }
              >
                <span className="planner-legend-dot planner-marker-public" />
                Public
              </button>

              <button
                type="button"
                className={
                  pointFilters.privateAccess
                    ? "active"
                    : "disabled"
                }
                aria-pressed={
                  pointFilters.privateAccess
                }
                onClick={() =>
                  togglePointFilter(
                    "privateAccess"
                  )
                }
              >
                <span className="planner-legend-dot planner-marker-private" />
                Private
              </button>

              <button
                type="button"
                className={
                  pointFilters.poi
                    ? "active"
                    : "disabled"
                }
                aria-pressed={
                  pointFilters.poi
                }
                onClick={() =>
                  togglePointFilter("poi")
                }
              >
                <span className="planner-legend-dot planner-marker-poi" />
                POIs
              </button>

              <button
                type="button"
                className={
                  pointFilters.hazard
                    ? "active"
                    : "disabled"
                }
                aria-pressed={
                  pointFilters.hazard
                }
                onClick={() =>
                  togglePointFilter(
                    "hazard"
                  )
                }
              >
                <span className="planner-legend-dot planner-marker-hazard" />
                Hazards
              </button>
            </div>

            {start || end ? (
              <div className="planner-map-selection-legend">
                {start ? (
                  <span>
                    <span className="planner-legend-dot planner-marker-start" />
                    Launch
                  </span>
                ) : null}

                {end ? (
                  <span>
                    <span className="planner-legend-dot planner-marker-end" />
                    Takeout
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

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

          <CenterMapOnState
            state={selectedState}
            enabled={!selectedRiver}
          />

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
                  weight: selected ? 7 : 5,
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
              {visibleMapPoints.map((point) => {
                const isStart =
                  point.id === startId;

                const isEnd =
                  point.id === endId;

                const isAccessPoint =
                  point.type ===
                    "public_access" ||
                  point.type ===
                    "private_access";

                return (
                  <Marker
                    key={point.id}
                    position={[
                      point.latitude,
                      point.longitude,
                    ]}
                    icon={getPlannerPointIcon(
                      point,
                      isStart,
                      isEnd
                    )}
                    zIndexOffset={
                      isStart || isEnd
                        ? 1000
                        : point.type === "hazard"
                          ? 500
                          : 0
                    }
                    eventHandlers={
                      isAccessPoint
                        ? {
                            click: () =>
                              selectPointFromMap(
                                point
                              ),
                          }
                        : undefined
                    }
                  >
                    <Popup>
                      <strong>
                        {point.name}
                      </strong>

                      <br />

                      {getPointLabel(point)}

                      {point.description ? (
                        <>
                          <br />
                          {point.description}
                        </>
                      ) : null}

                      {isAccessPoint ? (
                        <>
                          <div className="planner-popup-actions">
                            <button
                              type="button"
                              className="popup-button"
                              onClick={() => {
                                setStartId(point.id);

                                if (!endId) {
                                  setSelectionMode(
                                    "end"
                                  );
                                }
                              }}
                            >
                              Set as launch
                            </button>

                            <button
                              type="button"
                              className="popup-button"
                              onClick={() =>
                                setEndId(point.id)
                              }
                            >
                              Set as takeout
                            </button>
                          </div>

                          {isStart ? (
                            <p className="planner-popup-selection planner-popup-selection-start">
                              Selected launch
                            </p>
                          ) : null}

                          {isEnd ? (
                            <p className="planner-popup-selection planner-popup-selection-end">
                              Selected takeout
                            </p>
                          ) : null}
                        </>
                      ) : null}
                    </Popup>
                  </Marker>
                );
              })}
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
                  <span>Difficult</span>
                  <strong>{selectedRiver.difficulty}/5</strong>
                </div>
                <div>
                  <span>Clean</span>
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
              {selectedRiver.usgsGaugeId ? (
              <div className="selected-river-flow">
                {flowLoading ? (
                  <p className="muted">Loading current flow...</p>
                ) : flowCfs !== null ? (
                  <>
                    <p>
                      <strong>Current Flow:</strong> {Math.round(flowCfs)} CFS
                    </p>
                    <p>
                      <strong>Condition:</strong> {flowRating}
                    </p>
                  </>
                ) : (
                  <p className="muted">Current flow unavailable.</p>
                )}
              </div>
            ) : null}
            </div>

            {outfitters.length ? (
              <div className="overview-card">
                <p className="eyebrow">Outfitters</p>

                <div className="outfitter-list">
                  {outfitters.map((outfitter) => (
                    <div key={outfitter.id} className="outfitter-card">
                      <strong>{outfitter.name}</strong>

                      {outfitter.description ? (
                        <p>{outfitter.description}</p>
                      ) : null}

                      {outfitter.phone ? (
                        <p>
                          <strong>Phone:</strong> {outfitter.phone}
                        </p>
                      ) : null}

                      {outfitter.website ? (
                        <a
                          href={outfitter.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Website
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="overview-card trip-print-area">
              <p className="eyebrow">Trip Overview</p>

              {start && end ? (
                <>
                  <label className="form-label no-print">
                    Expected Launch Date/Time
                    <input
                      type="datetime-local"
                      value={plannedLaunchDateTime}
                      onChange={(event) => setPlannedLaunchDateTime(event.target.value)}
                    />
                  </label>

                  <div className="trip-print-layout">
                    <div className="trip-print-details">
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
                        <p><strong>River:</strong> {selectedRiver.name}, {selectedRiver.state}</p>
                        <p><strong>Difficulty:</strong> {selectedRiver.difficulty}/5</p>
                        <p><strong>Cleanliness:</strong> {selectedRiver.cleanliness}/5</p>
                        <p><strong>Fishing:</strong> {selectedRiver.fishing}/5</p>

                        {selectedRiver.usgsGaugeId ? (
                          <p><strong>USGS Gauge:</strong> {selectedRiver.usgsGaugeId}</p>
                        ) : null}

                        {flowCfs !== null ? (
                          <p><strong>Flow:</strong> {Math.round(flowCfs)} CFS — {flowRating}</p>
                        ) : null}

                        {plannedLaunchDateTime ? (
                          <p>
                            <strong>Expected Launch:</strong>{" "}
                            {new Date(plannedLaunchDateTime).toLocaleString()}
                          </p>
                        ) : null}

                        <p><strong>Launch:</strong> {start.name}</p>
                        <p><strong>Launch Type:</strong> {getPointLabel(start)}</p>
                        <p><strong>Takeout:</strong> {end.name}</p>
                        <p><strong>Takeout Type:</strong> {getPointLabel(end)}</p>
                      </div>

                      {plannedLaunchDateTime ? (
                        <div className="print-section">
                          <h3>Launch Weather Forecast</h3>

                          {weatherLoading ? (
                            <p className="muted">Loading weather forecast...</p>
                          ) : weatherError ? (
                            <p className="muted">{weatherError}</p>
                          ) : tripWeather ? (
                            <div className="trip-detail-list">
                              <p>
                                <strong>Forecast Time:</strong>{" "}
                                {new Date(tripWeather.forecastTime).toLocaleString()}
                              </p>

                              <p>
                                <strong>Temperature:</strong>{" "}
                                {tripWeather.temperatureF !== null
                                  ? `${Math.round(tripWeather.temperatureF)}°F`
                                  : "Unknown"}
                              </p>

                              <p>
                                <strong>Wind:</strong>{" "}
                                {tripWeather.windMph !== null
                                  ? `${Math.round(tripWeather.windMph)} mph`
                                  : "Unknown"}
                              </p>

                              <p>
                                <strong>Rain Chance:</strong>{" "}
                                {tripWeather.rainChancePercent !== null
                                  ? `${tripWeather.rainChancePercent}%`
                                  : "Unknown"}
                              </p>
                            </div>
                          ) : (
                            <p className="muted">No weather forecast loaded.</p>
                          )}
                        </div>
                      ) : null}

                      <div className="print-section">
                        <h3>Safety Reminders</h3>

                        <ul className="safety-list">
                          <li>Wear a properly fitted life jacket.</li>
                          <li>Check water level, current, and weather before launching.</li>
                          <li>Tell someone your route and expected takeout time.</li>
                          <li>Pack drinking water, phone protection, and basic first aid.</li>
                          <li>Leave no trash and avoid disturbing wildlife.</li>
                        </ul>
                      </div>

                      {timelinePoints.length > 0 ? (
                        <div className="print-section">
                          <h3>Distance Timeline</h3>

                          <div className="timeline-list">
                            {timelinePoints.map(({ point, distanceMiles }) => (
                              <div key={point.id} className="timeline-row">
                                <div className="timeline-distance">
                                  {distanceMiles.toFixed(1)} mi
                                </div>

                                <div>
                                  <strong>{point.name}</strong>
                                  <p>
                                    {getPointLabel(point)}
                                    {point.description ? ` — ${point.description}` : ""}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {printMode ? (
                      <div className="trip-print-map-column">
                        <PrintableRouteMap
                          river={selectedRiver}
                          start={start}
                          end={end}
                        />
                      </div>
                    ) : null}
                  </div>

                  <button
                    className="primary-button button-reset"
                    onClick={printTripPlan}
                  >
                    Print Trip Plan
                  </button>

                  <button
                    type="button"
                    className="secondary-button button-reset"
                    onClick={downloadTripPdf}
                  >
                    Download PDF
                  </button>

                  <button
                    type="button"
                    className="secondary-button button-reset"
                    onClick={openEmailTripDialog}
                  >
                    Email Trip Plan
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
      {emailTripDialogOpen ? (
        <div
          className="email-trip-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target
              === event.currentTarget
            ) {
              closeEmailTripDialog();
            }
          }}
        >
          <div
            className="email-trip-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-trip-title"
          >
            <div className="email-trip-modal-header">
              <div>
                <p className="eyebrow">
                  Trip Plan
                </p>

                <h2 id="email-trip-title">
                  Email Trip Plan
                </h2>
              </div>

              <button
                type="button"
                className="email-trip-modal-close"
                onClick={
                  closeEmailTripDialog
                }
                aria-label="Close email dialog"
                disabled={emailingTripPlan}
              >
                ×
              </button>
            </div>

            <div className="email-trip-modal-body">
              <p className="muted">
                YakQuest will generate the
                printable trip plan and send it
                as a PDF attachment from
                trips@yakquest.com.
              </p>

              {storedUser ? (
                <label className="email-trip-recipient-option">
                  <input
                    type="radio"
                    name="trip-email-recipient"
                    value="account"
                    checked={
                      emailRecipientMode
                      === "account"
                    }
                    onChange={() =>
                      setEmailRecipientMode(
                        "account"
                      )
                    }
                    disabled={
                      emailingTripPlan
                    }
                  />

                  <span>
                    <strong>
                      Send to the email
                      registered to my account
                    </strong>

                    <small>
                      {storedUser.email}
                    </small>
                  </span>
                </label>
              ) : null}

              <label className="email-trip-recipient-option">
                <input
                  type="radio"
                  name="trip-email-recipient"
                  value="manual"
                  checked={
                    emailRecipientMode
                    === "manual"
                  }
                  onChange={() =>
                    setEmailRecipientMode(
                      "manual"
                    )
                  }
                  disabled={
                    emailingTripPlan
                  }
                />

                <span>
                  <strong>
                    Send to another email
                    address
                  </strong>

                  <small>
                    No YakQuest account is
                    required.
                  </small>
                </span>
              </label>

              {emailRecipientMode
                === "manual" ? (
                <label className="form-label email-trip-address-field">
                  Email address

                  <input
                    type="email"
                    value={
                      manualEmailAddress
                    }
                    onChange={(event) =>
                      setManualEmailAddress(
                        event.target.value
                      )
                    }
                    placeholder="name@example.com"
                    autoComplete="email"
                    disabled={
                      emailingTripPlan
                    }
                  />
                </label>
              ) : null}

              {emailTripError ? (
                <p
                  className="email-trip-error"
                  role="alert"
                >
                  {emailTripError}
                </p>
              ) : null}

              {emailTripSuccess ? (
                <p
                  className="email-trip-success"
                  role="status"
                >
                  {emailTripSuccess}
                </p>
              ) : null}

              <div className="email-trip-actions">
                <button
                  type="button"
                  className="secondary-button button-reset"
                  onClick={
                    closeEmailTripDialog
                  }
                  disabled={
                    emailingTripPlan
                  }
                >
                  {emailTripSuccess
                    ? "Close"
                    : "Cancel"}
                </button>

                {!emailTripSuccess ? (
                  <button
                    type="button"
                    className="primary-button button-reset"
                    onClick={() => {
                      void emailTripPlan();
                    }}
                    disabled={
                      emailingTripPlan
                    }
                  >
                    {emailingTripPlan
                      ? (
                          "Generating and "
                          + "Sending..."
                        )
                      : "Send Trip Plan"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}