import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const title = mode === "login" ? "Log in" : "Create account";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName || undefined);
      }

      navigate("/account");
    } catch (err) {
      console.error(err);
      setError(
        mode === "login"
          ? "Login failed. Check your email and password."
          : "Registration failed. This email may already be registered."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">YakQuest Account</p>
        <h1>{title}</h1>

        <p className="muted">
          Accounts are optional. You only need one to sync saved trips,
          completed trips, and contributions across mobile and web.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label className="form-label">
              Display Name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your name"
              />
            </label>
          ) : null}

          <label className="form-label">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="form-label">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button className="primary-button auth-submit" disabled={loading}>
            {loading ? "Please wait..." : title}
          </button>
        </form>

        <button
          className="text-button"
          onClick={() => {
            setError("");
            setMode(mode === "login" ? "register" : "login");
          }}
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Log in"}
        </button>
      </div>
    </section>
  );
}