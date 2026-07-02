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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobileNav, setIsMobileNav] = useState(false);

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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");

    const updateIsMobile = () => {
      setIsMobileNav(mediaQuery.matches);
    };

    updateIsMobile();

    mediaQuery.addEventListener("change", updateIsMobile);

    return () => {
      mediaQuery.removeEventListener("change", updateIsMobile);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand" onClick={closeMenu}>
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

        {isMobileNav ? (
          <>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              ☰
            </button>

            {menuOpen ? (
              <nav className="mobile-nav">
                <Link to="/rivers" onClick={closeMenu}>Rivers</Link>
                <Link to="/plan" onClick={closeMenu}>Plan</Link>

                {user ? (
                  <>
                    <Link to="/saved-trips" onClick={closeMenu}>Saved Trips</Link>
                    <Link to="/account" onClick={closeMenu}>
                      {user.display_name || "Account"}
                    </Link>
                    {user.is_admin ? (
                      <Link to="/admin" onClick={closeMenu}>Admin</Link>
                    ) : null}
                  </>
                ) : (
                  <Link to="/login" onClick={closeMenu}>Login</Link>
                )}
              </nav>
            ) : null}
          </>
        ) : (
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
        )}
      </header>

      <main className="site-main">
        <Outlet />
      </main>
    </div>
  );
}