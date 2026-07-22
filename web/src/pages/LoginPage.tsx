import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  forgotPassword,
  login,
  register,
} from "../services/authService";

type AuthMode =
  | "login"
  | "register"
  | "forgot-password";

export default function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] =
    useState<AuthMode>("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const title =
    mode === "login"
      ? "Log in"
      : mode === "register"
        ? "Create account"
        : "Reset password";

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        navigate("/account");
        return;
      }

      if (mode === "register") {
        await register(email, password);

        navigate("/account");
        return;
      }

      const response =
        await forgotPassword(email);

      setMessage(response.message);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete request."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">
          YakQuest Account
        </p>

        <h1>{title}</h1>

        <p className="muted">
          {mode === "forgot-password"
            ? "Enter your email address and YakQuest will send you a secure, one-time password-reset link."
            : "Accounts sync saved trips, completed trips, and contributions across mobile and web."}
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <label className="form-label">
            Email

            <input
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          {mode !== "forgot-password" ? (
            <label className="form-label">
              Password

              <input
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Password"
                type="password"
                minLength={8}
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                required
              />
            </label>
          ) : null}

          {error ? (
            <div className="form-error">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="form-success">
              {message}
            </div>
          ) : null}

          <button
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "forgot-password"
                ? "Send Reset Link"
                : title}
          </button>
        </form>

        {mode === "login" ? (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setError("");
              setMessage("");
              setMode(
                "forgot-password"
              );
            }}
          >
            Forgot your password?
          </button>
        ) : null}

        <button
          type="button"
          className="text-button"
          onClick={() => {
            setError("");
            setMessage("");

            setMode(
              mode === "login"
                ? "register"
                : "login"
            );
          }}
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Return to login"}
        </button>
      </div>
    </section>
  );
}