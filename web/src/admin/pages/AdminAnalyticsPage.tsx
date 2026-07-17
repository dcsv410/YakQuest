import { useQuery } from "@tanstack/react-query";
import { fetchAdminAnalytics } from "../../services/adminService";

function formatElapsedTime(
  elapsedTimeSeconds: number
): string {
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

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

export default function AdminAnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: fetchAdminAnalytics,
  });

  if (isLoading) {
    return <p>Loading analytics...</p>;
  }

  if (error) {
    return <p>Unable to load analytics.</p>;
  }

  return (
    <section>
      <p className="eyebrow">Admin</p>
      <h1>Analytics</h1>

      <div className="admin-card-grid">
        <div className="admin-stat-card">
          <span>Rivers</span>
          <strong>{data?.rivers ?? 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Users</span>
          <strong>{data?.users ?? 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Unique Contributors</span>
          <strong>
            {data?.uniqueContributors ?? 0}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>Saved Trips</span>
          <strong>{data?.savedTrips ?? 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Completed Trips</span>
          <strong>{data?.completedTrips ?? 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Pending Contributions</span>
          <strong>{data?.pendingContributions ?? 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Approved Contributions</span>
          <strong>{data?.approvedContributions ?? 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Rejected Contributions</span>
          <strong>{data?.rejectedContributions ?? 0}</strong>
        </div>
      </div>

      <div className="admin-analytics-section">
        <div className="admin-analytics-section-heading">
          <div>
            <p className="eyebrow">
              Community Activity
            </p>

            <h2>
              Completed Trip Summary
            </h2>
          </div>

          <p className="muted">
            Combined trip history across all
            YakQuest users.
          </p>
        </div>

        <div className="trip-history-stats">
          <div className="trip-history-stat">
            <span>Trips Completed</span>

            <strong>
              {data?.completedTripSummary
                .tripsCompleted ?? 0}
            </strong>
          </div>

          <div className="trip-history-stat">
            <span>Actual Miles</span>

            <strong>
              {(
                data?.completedTripSummary
                  .actualMiles ?? 0
              ).toFixed(2)}
            </strong>
          </div>

          <div className="trip-history-stat">
            <span>Planned Miles</span>

            <strong>
              {(
                data?.completedTripSummary
                  .plannedMiles ?? 0
              ).toFixed(2)}
            </strong>
          </div>

          <div className="trip-history-stat">
            <span>Time on Water</span>

            <strong>
              {formatElapsedTime(
                data?.completedTripSummary
                  .elapsedTimeSeconds ?? 0
              )}
            </strong>
          </div>

          <div className="trip-history-stat">
            <span>Rivers Explored</span>

            <strong>
              {data?.completedTripSummary
                .riversExplored ?? 0}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}