import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchSavedTrips } from "../services/savedTripService";

export default function SavedTripsPage() {
  const {
    data: trips = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["savedTrips"],
    queryFn: fetchSavedTrips,
  });

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

              <Link
                className="primary-button"
                to={`/plan?savedTripId=${trip.id}`}
              >
                Open Trip
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}