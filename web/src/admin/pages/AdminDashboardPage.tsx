import { useQuery } from "@tanstack/react-query";
import { fetchAdminDashboard } from "../../services/adminService";

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: fetchAdminDashboard,
  });

  if (isLoading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p>Unable to load dashboard.</p>;
  }

  return (
    <div>
      <p className="eyebrow">Admin</p>
      <h1>Dashboard</h1>

      <div className="admin-card-grid">
        <div className="admin-stat-card">
          <span>Rivers</span>
          <strong>{data?.rivers ?? 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Pending Contributions</span>
          <strong>{data?.pendingContributions ?? 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Users</span>
          <strong>{data?.users ?? 0}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Completed Trips</span>
          <strong>{data?.completedTrips ?? 0}</strong>
        </div>
      </div>
    </div>
  );
}