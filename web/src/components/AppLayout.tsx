import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { APP_NAME, TAGLINE } from "../config";
import type { AuthUser } from "@yakquest/shared";
import {
  fetchMe,
  getStoredUser,
  listenForAuthChanges,
} from "../services/authService";

export default function AppLayout() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  useEffect(() => {
    async function refreshUser() {
      try {
        const currentUser = await fetchMe();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    }

    refreshUser();

    const unsubscribe = listenForAuthChanges(refreshUser);

    return unsubscribe;
  }, []);

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand">
          <div className="brand-mark">
            <img
              src="/yakquest-icon.png"
              alt="YakQuest"
              className="brand-icon"
            />
          </div>
          <div>
            <div className="brand-name">{APP_NAME}</div>
            <div className="brand-tagline">{TAGLINE}</div>
          </div>
        </Link>

        <nav className="nav">
          <Link to="/rivers">Rivers</Link>
          <Link to="/plan">Plan</Link>

          {user ? (
            <>
              <Link to="/saved-trips">Saved Trips</Link>
              <Link to="/account">
                {user.display_name || "Account"}
              </Link>
              {user.is_admin ? <Link to="/admin">Admin</Link> : null}
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </header>

      <main className="site-main">
        <Outlet />
      </main>
    </div>
  );
}