import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchMe,
  getStoredUser,
  logout,
  type AuthUser,
} from "../services/authService";

export default function AccountPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await fetchMe();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function handleLogout() {
    logout();
    setUser(null);
    navigate("/");
  }

  if (loading) {
    return <p>Loading account...</p>;
  }

  if (!user) {
    return (
      <section className="account-page">
        <div className="account-card">
          <p className="eyebrow">YakQuest Account</p>
          <h1>Sync your paddling plans.</h1>

          <p className="muted">
            You can use YakQuest without an account. Create one when you want to
            sync saved trips, completed trips, and contributions across mobile
            and web.
          </p>

          <div className="account-benefits">
            <div>✓ Save trips across devices</div>
            <div>✓ Sync completed trip history</div>
            <div>✓ Submit river updates and access points</div>
            <div>✓ Track contribution status</div>
          </div>

          <div className="hero-actions">
            <Link className="primary-button" to="/login">
              Log In
            </Link>
            <Link className="secondary-button" to="/login">
              Create Account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="account-page">
      <div className="account-grid">
        <div className="account-card">
          <p className="eyebrow">Account</p>
          <h1>{user.display_name || "Paddler"}</h1>
          <p className="muted">{user.email}</p>

          <div className="account-detail-list">
            <div>
              <span>Trust Score</span>
              <strong>{user.trust_score}</strong>
            </div>

            <div>
              <span>Admin</span>
              <strong>{user.is_admin ? "Yes" : "No"}</strong>
            </div>
          </div>

          <button
            className="secondary-button account-button"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>

        <div className="account-card">
          <p className="eyebrow">YakQuest Sync</p>
          <h2>Your data</h2>

          <div className="account-links">
            <Link to="/saved-trips">Saved Trips</Link>
            <Link to="/completed-trips">Trip History</Link>
            <Link to="/contributions">Contributions</Link>
            {user.is_admin ? <Link to="/admin">Admin Dashboard</Link> : null}
          </div>
        </div>
      </div>
    </section>
  );
}