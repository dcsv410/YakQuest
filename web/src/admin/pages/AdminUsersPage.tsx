import { useEffect, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  AdminUserDTO,
  AdminUserUpdateDTO,
} from "@yakquest/shared";

import {
  fetchAdminUsers,
  updateAdminUser,
} from "../../services/adminService";

type EditableAdminUser = {
  isAdmin: boolean;
  trustScore: string;
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchAdminUsers,
  });

  const [editableUsers, setEditableUsers] =
    useState<
      Record<string, EditableAdminUser>
    >({});

  const [savingUserId, setSavingUserId] =
    useState<string | null>(null);

  const [pageError, setPageError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  useEffect(() => {
    setEditableUsers((current) => {
      const next = { ...current };

      users.forEach((user) => {
        if (!next[user.id]) {
          next[user.id] = {
            isAdmin: user.isAdmin,
            trustScore:
              user.trustScore.toString(),
          };
        }
      });

      return next;
    });
  }, [users]);

  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      updates,
    }: {
      userId: string;
      updates: AdminUserUpdateDTO;
    }) => updateAdminUser(userId, updates),

    onSuccess: (
      updatedUser: AdminUserDTO
    ) => {
      queryClient.setQueryData<
        AdminUserDTO[]
      >(
        ["adminUsers"],
        (currentUsers = []) =>
          currentUsers.map((user) =>
            user.id === updatedUser.id
              ? updatedUser
              : user
          )
      );

      setEditableUsers((current) => ({
        ...current,
        [updatedUser.id]: {
          isAdmin: updatedUser.isAdmin,
          trustScore:
            updatedUser.trustScore.toString(),
        },
      }));

      setPageError(null);
      setSuccessMessage(
        `${updatedUser.email} was updated.`
      );
      setSavingUserId(null);
    },

    onError: (mutationError) => {
      console.error(
        "Unable to update admin user",
        mutationError
      );

      setSuccessMessage(null);
      setPageError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to update this user."
      );
      setSavingUserId(null);
    },
  });

  const updateEditableUser = (
    userId: string,
    updates: Partial<EditableAdminUser>
  ) => {
    setEditableUsers((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        ...updates,
      },
    }));

    setPageError(null);
    setSuccessMessage(null);
  };

  const resetUser = (user: AdminUserDTO) => {
    setEditableUsers((current) => ({
      ...current,
      [user.id]: {
        isAdmin: user.isAdmin,
        trustScore:
          user.trustScore.toString(),
      },
    }));

    setPageError(null);
    setSuccessMessage(null);
  };

  const saveUser = (user: AdminUserDTO) => {
    const editableUser =
      editableUsers[user.id];

    if (!editableUser) {
      return;
    }

    const trustScore = Number(
      editableUser.trustScore
    );

    if (
      !Number.isInteger(trustScore) ||
      trustScore < 0 ||
      trustScore > 100
    ) {
      setSuccessMessage(null);
      setPageError(
        "Trust score must be a whole number between 0 and 100."
      );
      return;
    }

    const updates: AdminUserUpdateDTO = {};

    if (
      editableUser.isAdmin !== user.isAdmin
    ) {
      updates.isAdmin =
        editableUser.isAdmin;
    }

    if (
      trustScore !== user.trustScore
    ) {
      updates.trustScore = trustScore;
    }

    if (
      updates.isAdmin === undefined &&
      updates.trustScore === undefined
    ) {
      setPageError(null);
      setSuccessMessage(
        `${user.email} has no unsaved changes.`
      );
      return;
    }

    setSavingUserId(user.id);
    setPageError(null);
    setSuccessMessage(null);

    updateUserMutation.mutate({
      userId: user.id,
      updates,
    });
  };

  const hasUserChanges = (
    user: AdminUserDTO
  ) => {
    const editableUser =
      editableUsers[user.id];

    if (!editableUser) {
      return false;
    }

    return (
      editableUser.isAdmin !==
        user.isAdmin ||
      editableUser.trustScore !==
        user.trustScore.toString()
    );
  };

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

      <p className="admin-users-intro">
        Manage administrator access and
        contribution trust scores. Trust
        scores must be between 0 and 100.
      </p>

      {pageError ? (
        <div
          className="admin-users-message admin-users-message-error"
          role="alert"
        >
          {pageError}
        </div>
      ) : null}

      {successMessage ? (
        <div
          className="admin-users-message admin-users-message-success"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      <div className="admin-table-card">
        <table className="admin-table admin-users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Admin</th>
              <th>Approved</th>
              <th>Rejected</th>
              <th>Trust Score</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const editableUser =
                editableUsers[user.id];

              const isSaving =
                savingUserId === user.id;

              const hasChanges =
                hasUserChanges(user);

              return (
                <tr key={user.id}>
                  <td
                    data-label="Email"
                    className="admin-user-email"
                  >
                    {user.email}
                  </td>

                  <td data-label="Name">
                    {user.displayName || "—"}
                  </td>

                  <td data-label="Admin">
                    <label className="admin-user-toggle">
                      <input
                        type="checkbox"
                        checked={
                          editableUser
                            ?.isAdmin ??
                          user.isAdmin
                        }
                        disabled={isSaving}
                        onChange={(event) =>
                          updateEditableUser(
                            user.id,
                            {
                              isAdmin:
                                event.target
                                  .checked,
                            }
                          )
                        }
                      />

                      <span>
                        {(
                          editableUser
                            ?.isAdmin ??
                          user.isAdmin
                        )
                          ? "Admin"
                          : "User"}
                      </span>
                    </label>
                  </td>

                  <td data-label="Approved">
                    <span className="admin-user-contribution-count admin-user-contribution-count-approved">
                      {user.approvedContributions}
                    </span>
                  </td>

                  <td data-label="Rejected">
                    <span className="admin-user-contribution-count admin-user-contribution-count-rejected">
                      {user.rejectedContributions}
                    </span>
                  </td>

                  <td data-label="Trust Score">
                    <input
                      className="admin-user-trust-input"
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      inputMode="numeric"
                      value={
                        editableUser
                          ?.trustScore ??
                        user.trustScore.toString()
                      }
                      disabled={isSaving}
                      onChange={(event) =>
                        updateEditableUser(
                          user.id,
                          {
                            trustScore:
                              event.target
                                .value,
                          }
                        )
                      }
                      aria-label={`Trust score for ${user.email}`}
                    />
                  </td>

                  <td data-label="Actions">
                    <div className="admin-user-actions">
                      <button
                        type="button"
                        className="admin-user-save-button"
                        disabled={
                          isSaving ||
                          !hasChanges
                        }
                        onClick={() =>
                          saveUser(user)
                        }
                      >
                        {isSaving
                          ? "Saving..."
                          : "Save"}
                      </button>

                      <button
                        type="button"
                        className="admin-user-reset-button"
                        disabled={
                          isSaving ||
                          !hasChanges
                        }
                        onClick={() =>
                          resetUser(user)
                        }
                      >
                        Reset
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="admin-users-empty"
                >
                  No users were found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}