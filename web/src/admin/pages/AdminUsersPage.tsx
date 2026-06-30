import { useQuery } from "@tanstack/react-query";
import { fetchAdminUsers } from "../../services/adminService";

export default function AdminUsersPage() {
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchAdminUsers,
  });

  if (isLoading) {
    return <p>Loading users...</p>;
  }

  if (error) {
    return <p>Unable to load users.</p>;
  }

  return (
    <section>
      <p className="eyebrow">Admin</p>
      <h1>Users</h1>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Admin</th>
              <th>Trust Score</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.displayName || "—"}</td>
                <td>{user.isAdmin ? "Yes" : "No"}</td>
                <td>{user.trustScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}