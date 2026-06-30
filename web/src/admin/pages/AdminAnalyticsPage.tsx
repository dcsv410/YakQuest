import { useQuery } from "@tanstack/react-query";
import { fetchAdminAnalytics } from "../../services/adminService";

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
    </section>
  );
}