import { useState } from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import { resetPassword } from "../services/authService";

export default function ResetPasswordPage() {
  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "This password-reset link is missing its token."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        "The passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await resetPassword(
          token,
          newPassword
        );

      setSuccess(response.message);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset password."
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

        <h1>Choose a new password</h1>

        <p className="muted">
          Enter a new password containing
          at least eight characters.
        </p>

        {success ? (
          <>
            <div className="form-success">
              {success}
            </div>

            <Link
              className="primary-button auth-submit"
              to="/login"
            >
              Return to Login
            </Link>
          </>
        ) : (
          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label className="form-label">
              New Password

              <input
                type="password"
                value={newPassword}
                minLength={8}
                autoComplete="new-password"
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className="form-label">
              Confirm New Password

              <input
                type="password"
                value={confirmPassword}
                minLength={8}
                autoComplete="new-password"
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                required
              />
            </label>

            {error ? (
              <div className="form-error">
                {error}
              </div>
            ) : null}

            <button
              className="primary-button auth-submit"
              disabled={loading}
            >
              {loading
                ? "Resetting..."
                : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}