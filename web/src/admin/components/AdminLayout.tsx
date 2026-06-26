import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { fetchMe, getStoredUser } from "../../services/authService";
import type { AuthUser } from "@yakquest/shared";

export default function AdminLayout() {
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAdmin() {
      try {
        const currentUser = await fetchMe();

        if (!currentUser.is_admin) {
          navigate("/account");
          return;
        }

        setUser(currentUser);
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    verifyAdmin();
  }, [navigate]);

  if (loading) {
    return <p>Loading admin...</p>;
  }

  if (!user?.is_admin) {
    return null;
  }

  return (
    <section className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link to="/" className="admin-brand-link">
            YakQuest
          </Link>
          <span>Admin</span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
          <NavLink to="/admin/rivers">
            Rivers
          </NavLink>
          <NavLink to="/admin/contributions">
            Contributions
          </NavLink>
          <NavLink to="/admin/users">
            Users
          </NavLink>
          <NavLink to="/admin/analytics">
            Analytics
          </NavLink>
        </nav>

        <div className="admin-user">
          <strong>{user.display_name || "Admin"}</strong>
          <span>{user.email}</span>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </section>
  );
}