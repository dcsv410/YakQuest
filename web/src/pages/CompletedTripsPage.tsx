import {
  useMemo,
  useState,
} from "react";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CompletedTrip,
} from "@yakquest/shared";

import {
  deleteCompletedTrip,
  fetchCompletedTrips,
  updateCompletedTrip,
} from "../services/completedTripService";

function formatElapsedTime(
  elapsedTimeSeconds?: number | null
) {
  if (
    elapsedTimeSeconds === null ||
    elapsedTimeSeconds === undefined
  ) {
    return "Not recorded";
  }

  const totalMinutes = Math.round(
    elapsedTimeSeconds / 60
  );

  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours} hr ${minutes} min`;
}

function formatDate(
  dateValue?: string | null
) {
  if (!dateValue) {
    return "Date not recorded";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date not recorded";
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

export default function CompletedTripsPage() {
  const queryClient = useQueryClient();

  const {
    data: trips = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["completedTrips"],
    queryFn: fetchCompletedTrips,
  });

  const [
    editingTripId,
    setEditingTripId,
  ] = useState<string | null>(null);

  const [
    editingNotes,
    setEditingNotes,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const stats = useMemo(() => {
    const actualMiles = trips.reduce(
      (total, trip) =>
        total +
        (trip.actualDistanceMiles ?? 0),
      0
    );

    const plannedMiles = trips.reduce(
      (total, trip) =>
        total +
        (trip.plannedDistanceMiles ?? 0),
      0
    );

    const elapsedTimeSeconds =
      trips.reduce(
        (total, trip) =>
          total +
          (trip.elapsedTimeSeconds ?? 0),
        0
      );

    const riversExplored = new Set(
      trips.map((trip) => trip.riverId)
    ).size;

    return {
      tripsCompleted: trips.length,
      actualMiles,
      plannedMiles,
      elapsedTimeSeconds,
      riversExplored,
    };
  }, [trips]);

  function beginEditing(
    trip: CompletedTrip
  ) {
    setActionError("");
    setEditingTripId(trip.id);
    setEditingNotes(trip.notes ?? "");
  }

  function cancelEditing() {
    setEditingTripId(null);
    setEditingNotes("");
    setActionError("");
  }

  async function saveNotes(
    tripId: string
  ) {
    setActionError("");

    try {
      await updateCompletedTrip(
        tripId,
        editingNotes.trim()
      );

      await queryClient.invalidateQueries({
        queryKey: ["completedTrips"],
      });

      setEditingTripId(null);
      setEditingNotes("");
    } catch (error) {
      console.error(
        "Failed to update completed trip:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update the trip notes."
      );
    }
  }

  async function removeTrip(
    trip: CompletedTrip
  ) {
    const confirmed = window.confirm(
      `Remove this completed trip on ${trip.riverName}?`
    );

    if (!confirmed) {
      return;
    }

    setActionError("");

    try {
      await deleteCompletedTrip(
        trip.id
      );

      await queryClient.invalidateQueries({
        queryKey: ["completedTrips"],
      });

      if (
        editingTripId === trip.id
      ) {
        cancelEditing();
      }
    } catch (error) {
      console.error(
        "Failed to remove completed trip:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to remove the completed trip."
      );
    }
  }

  if (isLoading) {
    return (
      <section>
        <p className="eyebrow">
          Trip History
        </p>

        <h1>Your Completed Trips</h1>

        <p className="muted">
          Loading trip history...
        </p>
      </section>
    );
  }

  if (error) {
    console.error(
      "Failed to load completed trips:",
      error
    );

    return (
      <section>
        <p className="eyebrow">
          Trip History
        </p>

        <h1>Your Completed Trips</h1>

        <div className="page-error">
          <p>
            We were unable to load your
            trip history.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: [
                  "completedTrips",
                ],
              })
            }
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <p className="eyebrow">
        Trip History
      </p>

      <h1>Your Completed Trips</h1>

      <div className="trip-history-stats">
        <div className="trip-history-stat">
          <span>Trips Completed</span>
          <strong>
            {stats.tripsCompleted}
          </strong>
        </div>

        <div className="trip-history-stat">
          <span>Actual Miles</span>
          <strong>
            {stats.actualMiles.toFixed(2)}
          </strong>
        </div>

        <div className="trip-history-stat">
          <span>Planned Miles</span>
          <strong>
            {stats.plannedMiles.toFixed(2)}
          </strong>
        </div>

        <div className="trip-history-stat">
          <span>Time on Water</span>
          <strong>
            {formatElapsedTime(
              stats.elapsedTimeSeconds
            )}
          </strong>
        </div>

        <div className="trip-history-stat">
          <span>Rivers Explored</span>
          <strong>
            {stats.riversExplored}
          </strong>
        </div>
      </div>

      {actionError ? (
        <p className="page-error-message">
          {actionError}
        </p>
      ) : null}

      {trips.length === 0 ? (
        <div className="trip-history-empty">
          <h2>
            No completed trips yet
          </h2>

          <p className="muted">
            Trips completed through
            YakQuest will appear here,
            along with your lifetime
            paddling statistics.
          </p>
        </div>
      ) : (
        <div className="river-grid">
          {trips.map((trip) => (
            <article
              key={trip.id}
              className="river-card completed-trip-card"
            >
              <div className="completed-trip-header">
                <div>
                  <h2>
                    {trip.riverName}
                  </h2>

                  {trip.state ? (
                    <p className="muted">
                      {trip.state}
                    </p>
                  ) : null}
                </div>

                <span className="completed-trip-date">
                  {formatDate(
                    trip.completedAt
                  )}
                </span>
              </div>

              <div className="completed-trip-route">
                <p>
                  <span>Start</span>
                  <strong>
                    {trip.startName ||
                      "Not recorded"}
                  </strong>
                </p>

                <p>
                  <span>End</span>
                  <strong>
                    {trip.endName ||
                      "Not recorded"}
                  </strong>
                </p>
              </div>

              <div className="stats-row">
                <span>
                  Actual:{" "}
                  {(
                    trip.actualDistanceMiles ??
                    0
                  ).toFixed(2)}{" "}
                  mi
                </span>

                <span>
                  Planned:{" "}
                  {(
                    trip.plannedDistanceMiles ??
                    0
                  ).toFixed(2)}{" "}
                  mi
                </span>

                <span>
                  Time:{" "}
                  {formatElapsedTime(
                    trip.elapsedTimeSeconds
                  )}
                </span>
              </div>

              {editingTripId ===
              trip.id ? (
                <div className="completed-trip-notes-editor">
                  <label className="form-label">
                    Trip notes

                    <textarea
                      value={
                        editingNotes
                      }
                      onChange={(
                        event
                      ) =>
                        setEditingNotes(
                          event.target
                            .value
                        )
                      }
                      rows={4}
                      placeholder="Add notes about this trip..."
                    />
                  </label>

                  <div className="saved-trip-actions">
                    <button
                      type="button"
                      className="primary-button saved-trip-button"
                      onClick={() =>
                        saveNotes(
                          trip.id
                        )
                      }
                    >
                      Save Notes
                    </button>

                    <button
                      type="button"
                      className="secondary-button saved-trip-button"
                      onClick={
                        cancelEditing
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="completed-trip-notes">
                  <strong>Notes</strong>

                  <p>
                    {trip.notes ||
                      "No notes were added for this trip."}
                  </p>
                </div>
              )}

              <div className="saved-trip-actions">
                <button
                  type="button"
                  className="secondary-button saved-trip-button"
                  onClick={() =>
                    beginEditing(trip)
                  }
                >
                  Edit Notes
                </button>

                <button
                  type="button"
                  className="danger-button saved-trip-button"
                  onClick={() =>
                    removeTrip(trip)
                  }
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}