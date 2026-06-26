export default function AdminDashboardPage() {
  return (
    <div>
      <p className="eyebrow">Admin</p>
      <h1>Dashboard</h1>

      <div className="admin-card-grid">
        <div className="admin-stat-card">
          <span>Rivers</span>
          <strong>—</strong>
        </div>

        <div className="admin-stat-card">
          <span>Pending Contributions</span>
          <strong>—</strong>
        </div>

        <div className="admin-stat-card">
          <span>Users</span>
          <strong>—</strong>
        </div>

        <div className="admin-stat-card">
          <span>Completed Trips</span>
          <strong>—</strong>
        </div>
      </div>
    </div>
  );
}