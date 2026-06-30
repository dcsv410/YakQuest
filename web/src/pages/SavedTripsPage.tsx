import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchSavedTrips, deleteSavedTrip } from "../services/savedTripService";

export default function SavedTripsPage() {
  const {
    data: trips = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["savedTrips"],
    queryFn: fetchSavedTrips,
  });

  const queryClient = useQueryClient();

  async function removeSavedTrip(id: string) {
    const confirmed = window.confirm("Remove this saved trip?");

    if (!confirmed) return;

    try {
      await deleteSavedTrip(id);

      await queryClient.invalidateQueries({
        queryKey: ["savedTrips"],
      });
    } catch (error) {
      console.error(error);
      alert("Failed to remove saved trip.");
    }
  }

  if (isLoading) {
    return <p>Loading saved trips...</p>;
  }

  if (error) {
    return (
      <>
        <h1>Saved Trips</h1>
        <p>Unable to load trips.</p>
      </>
    );
  }

  return (
    <section>
      <p className="eyebrow">Saved Trips</p>

      <h1>Your Trips</h1>

      {trips.length === 0 ? (
        <p className="muted">
          You haven't saved any trips yet.
        </p>
      ) : (
        <div className="river-grid">
          {trips.map((trip) => (
            <div key={trip.id} className="river-card">
              <h2>{trip.name || "Saved Trip"}</h2>

              <p>
                <strong>{trip.startName}</strong>
              </p>

              <p>↓</p>

              <p>
                <strong>{trip.endName}</strong>
              </p>

              <div className="stats-row">
                <span>
                  Distance:{" "}
                  {trip.plannedDistanceMiles.toFixed(1)} mi
                </span>

                {trip.estimatedTimeMin ? (
                  <span>
                    Estimated: {trip.estimatedTimeMin} min
                  </span>
                ) : null}
              </div>

              <div className="saved-trip-actions">
                <Link
                  className="primary-button saved-trip-button"
                  to={`/plan?savedTripId=${trip.id}`}
                >
                  Open Trip
                </Link>

                <button
                  type="button"
                  className="danger-button saved-trip-button"
                  onClick={() => removeSavedTrip(trip.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}