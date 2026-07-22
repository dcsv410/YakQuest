import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import type {
  AuthUser,
} from "@yakquest/shared";

import {
  changePassword,
  deleteAccount,
  fetchMe,
  getStoredUser,
  logout,
  updateProfile,
} from "../services/authService";

import {
  US_STATES,
} from "../constants/usStates";

export default function AccountPage() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState<AuthUser | null>(
      () => getStoredUser()
    );

  const [loading, setLoading] =
    useState(true);

  const [
    displayName,
    setDisplayName,
  ] = useState(
    () =>
      getStoredUser()?.display_name ||
      "YakQuest User"
  );

  const [
    homeState,
    setHomeState,
  ] = useState(
    () =>
      getStoredUser()?.home_state ||
      "AL"
  );

  const [
    profileMessage,
    setProfileMessage,
  ] = useState("");

  const [
    profileError,
    setProfileError,
  ] = useState("");

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(false);

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    passwordLoading,
    setPasswordLoading,
  ] = useState(false);

  const [
    deletePassword,
    setDeletePassword,
  ] = useState("");

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState("");

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser =
          await fetchMe();

        setUser(currentUser);

        setDisplayName(
          currentUser.display_name ||
            "YakQuest User"
        );

        setHomeState(
          currentUser.home_state ||
            "AL"
        );
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

  async function handleUpdateProfile(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setProfileError("");
    setProfileMessage("");

    const cleanedDisplayName =
      displayName.trim();

    if (cleanedDisplayName.length > 255) {
      setProfileError(
        "Display name must be 255 characters or fewer."
      );
      return;
    }

    try {
      setProfileLoading(true);

      const updatedUser =
        await updateProfile(
          cleanedDisplayName ||
            "YakQuest User",
          homeState
        );

      setUser(updatedUser);

      setDisplayName(
        updatedUser.display_name
      );

      setHomeState(
        updatedUser.home_state
      );

      setProfileMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Unable to update profile."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleChangePassword(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setPasswordError(
        "The new passwords do not match."
      );
      return;
    }

    try {
      setPasswordLoading(true);

      const response =
        await changePassword(
          currentPassword,
          newPassword
        );

      setPasswordMessage(
        response.message
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Unable to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setDeleteError("");

    if (
      deleteConfirmation !== "DELETE"
    ) {
      setDeleteError(
        'Type "DELETE" to confirm.'
      );
      return;
    }

    const confirmed =
      window.confirm(
        "This permanently deletes your account, saved trips, trip history, and pending contributions. Continue?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(true);

      await deleteAccount(
        deletePassword
      );

      setUser(null);
      navigate("/");
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Unable to delete account."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return <p>Loading account...</p>;
  }

  if (!user) {
    return (
      <section className="account-page">
        <div className="account-card">
          <p className="eyebrow">
            YakQuest Account
          </p>

          <h1>
            Sync your paddling plans.
          </h1>

          <p className="muted">
            Create an account to sync
            trips and submit contributions
            across mobile and web.
          </p>

          <div className="hero-actions">
            <Link
              className="primary-button"
              to="/login"
            >
              Log In
            </Link>

            <Link
              className="secondary-button"
              to="/login"
            >
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
          <p className="eyebrow">
            Account
          </p>

          <h1>
            {user.display_name ||
              "YakQuest User"}
          </h1>

          <p className="muted">
            {user.email}
          </p>

          <div className="account-detail-list">
            <div>
              <span>Home State</span>
              <strong>
                {user.home_state || "AL"}
              </strong>
            </div>
            <div>
              <span>Trust Score</span>
              <strong>
                {user.trust_score}
              </strong>
            </div>

            <div>
              <span>Admin</span>
              <strong>
                {user.is_admin
                  ? "Yes"
                  : "No"}
              </strong>
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
          <p className="eyebrow">
            Profile
          </p>

          <h2>Personalize YakQuest</h2>

          <p className="muted">
            Your home state helps YakQuest show
            more relevant rivers and paddling
            information.
          </p>

          <form
            className="auth-form"
            onSubmit={handleUpdateProfile}
          >
            <label className="form-label">
              Display Name

              <input
                type="text"
                value={displayName}
                maxLength={255}
                autoComplete="name"
                placeholder="YakQuest User"
                onChange={(event) =>
                  setDisplayName(
                    event.target.value
                  )
                }
              />
            </label>

            <label className="form-label">
              Home State

              <select
                value={homeState}
                onChange={(event) =>
                  setHomeState(
                    event.target.value
                  )
                }
              >
                {US_STATES.map((state) => (
                  <option
                    key={state.code}
                    value={state.code}
                  >
                    {state.name}
                  </option>
                ))}
              </select>
            </label>

            {profileError ? (
              <div className="form-error">
                {profileError}
              </div>
            ) : null}

            {profileMessage ? (
              <div className="form-success">
                {profileMessage}
              </div>
            ) : null}

            <button
              type="submit"
              className="primary-button"
              disabled={profileLoading}
            >
              {profileLoading
                ? "Saving..."
                : "Save Profile"}
            </button>
          </form>
        </div>

        <div className="account-card">
          <p className="eyebrow">
            YakQuest Sync
          </p>

          <h2>Your data</h2>

          <div className="account-links">
            <Link to="/saved-trips">
              Saved Trips
            </Link>

            <Link to="/completed-trips">
              Trip History
            </Link>

            <Link to="/contributions">
              Contributions
            </Link>

            {user.is_admin ? (
              <Link to="/admin">
                Admin Dashboard
              </Link>
            ) : null}
          </div>
        </div>

        <div className="account-card">
          <p className="eyebrow">
            Security
          </p>

          <h2>Change password</h2>

          <form
            className="auth-form"
            onSubmit={
              handleChangePassword
            }
          >
            <label className="form-label">
              Current Password

              <input
                type="password"
                value={currentPassword}
                autoComplete="current-password"
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value
                  )
                }
                required
              />
            </label>

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

            {passwordError ? (
              <div className="form-error">
                {passwordError}
              </div>
            ) : null}

            {passwordMessage ? (
              <div className="form-success">
                {passwordMessage}
              </div>
            ) : null}

            <button
              className="primary-button"
              disabled={passwordLoading}
            >
              {passwordLoading
                ? "Changing..."
                : "Change Password"}
            </button>
          </form>
        </div>

        <div className="account-card account-danger-card">
          <p className="eyebrow">
            Danger Zone
          </p>

          <h2>Delete account</h2>

          <p className="muted">
            This permanently deletes your
            account, saved trips, completed
            trips, and pending
            contributions.
          </p>

          <p className="muted">
            Approved contributions remain
            in YakQuest but are anonymized.
          </p>

          <form
            className="auth-form"
            onSubmit={
              handleDeleteAccount
            }
          >
            <label className="form-label">
              Current Password

              <input
                type="password"
                value={deletePassword}
                autoComplete="current-password"
                onChange={(event) =>
                  setDeletePassword(
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className="form-label">
              Type DELETE to confirm

              <input
                value={deleteConfirmation}
                onChange={(event) =>
                  setDeleteConfirmation(
                    event.target.value
                  )
                }
                autoComplete="off"
                required
              />
            </label>

            {deleteError ? (
              <div className="form-error">
                {deleteError}
              </div>
            ) : null}

            <button
              className="account-delete-button"
              disabled={
                deleteLoading ||
                deleteConfirmation !==
                  "DELETE"
              }
            >
              {deleteLoading
                ? "Deleting..."
                : "Delete Account"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}