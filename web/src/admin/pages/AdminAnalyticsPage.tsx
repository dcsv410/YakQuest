import {
  useMemo,
  useState,
} from "react";

import { useQuery } from "@tanstack/react-query";

import type {
  AdminCompletedTripRowDTO,
} from "@yakquest/shared";

import {
  US_STATES,
} from "../../constants/usStates";

import {
  fetchAdminAnalytics,
  fetchFilteredAdminAnalytics,
} from "../../services/adminService";

type DatePreset =
  | "today"
  | "last7"
  | "last30"
  | "thisMonth"
  | "previousMonth"
  | "thisYear"
  | "custom";

type AnalyticsFilterState = {
  homeState: string;
  preset: DatePreset;
  startDate: string;
  endDate: string;
};

function formatDateInput(
  date: Date
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRange(
  preset: DatePreset
): {
  startDate: string;
  endDate: string;
} {
  const today = new Date();

  const end = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  let start = new Date(end);

  switch (preset) {
    case "today":
      break;

    case "last7":
      start.setDate(
        start.getDate() - 6
      );
      break;

    case "last30":
      start.setDate(
        start.getDate() - 29
      );
      break;

    case "thisMonth":
      start = new Date(
        end.getFullYear(),
        end.getMonth(),
        1
      );
      break;

    case "previousMonth":
      start = new Date(
        end.getFullYear(),
        end.getMonth() - 1,
        1
      );

      end.setFullYear(
        start.getFullYear()
      );

      end.setMonth(
        start.getMonth() + 1
      );

      end.setDate(0);
      break;

    case "thisYear":
      start = new Date(
        end.getFullYear(),
        0,
        1
      );
      break;

    case "custom":
      break;
  }

  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
  };
}

function formatElapsedTime(
  elapsedTimeSeconds: number
): string {
  const totalMinutes = Math.round(
    elapsedTimeSeconds / 60
  );

  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes =
    totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

function formatDisplayDate(
  value: string
): string {
  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(new Date(value));
}

function CompletedTripsTable({
  trips,
  emptyMessage,
}: {
  trips: AdminCompletedTripRowDTO[];
  emptyMessage: string;
}) {
  return (
    <div className="admin-table-card">
      <table className="admin-table admin-analytics-trip-table">
        <thead>
          <tr>
            <th>Completed</th>
            <th>User</th>
            <th>Home</th>
            <th>River</th>
            <th>Route</th>
            <th>Planned</th>
            <th>Actual</th>
            <th>Time</th>
          </tr>
        </thead>

        <tbody>
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td data-label="Completed">
                {formatDisplayDate(
                  trip.completedAt
                )}
              </td>

              <td data-label="User">
                <strong>
                  {trip.userDisplayName}
                </strong>

                <div className="admin-analytics-user-email">
                  {trip.userEmail}
                </div>
              </td>

              <td data-label="Home">
                {trip.userHomeState}
              </td>

              <td data-label="River">
                <strong>
                  {trip.riverName}
                </strong>

                {trip.riverState ? (
                  <div className="admin-analytics-user-email">
                    {trip.riverState}
                  </div>
                ) : null}
              </td>

              <td data-label="Route">
                {trip.startName ||
                  "Unknown launch"}
                {" → "}
                {trip.endName ||
                  "Unknown takeout"}
              </td>

              <td data-label="Planned">
                {trip.plannedMiles.toFixed(2)} mi
              </td>

              <td data-label="Actual">
                {trip.actualMiles.toFixed(2)} mi
              </td>

              <td data-label="Time">
                {formatElapsedTime(
                  trip.elapsedTimeSeconds
                )}
              </td>
            </tr>
          ))}

          {trips.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="admin-users-empty"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const defaultRange = useMemo(
    () => getDateRange("last30"),
    []
  );

  const [
    draftFilters,
    setDraftFilters,
  ] = useState<AnalyticsFilterState>({
    homeState: "",
    preset: "last30",
    ...defaultRange,
  });

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState<AnalyticsFilterState>({
    homeState: "",
    preset: "last30",
    ...defaultRange,
  });

  const {
    data: globalData,
    isLoading: globalLoading,
    error: globalError,
  } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: fetchAdminAnalytics,
  });

  const {
    data: filteredData,
    isLoading: filteredLoading,
    isFetching: filteredFetching,
    error: filteredError,
  } = useQuery({
    queryKey: [
      "adminFilteredAnalytics",
      appliedFilters.homeState,
      appliedFilters.startDate,
      appliedFilters.endDate,
    ],

    queryFn: () =>
      fetchFilteredAdminAnalytics({
        homeState:
          appliedFilters.homeState ||
          undefined,
        startDate:
          appliedFilters.startDate,
        endDate:
          appliedFilters.endDate,
      }),
  });

  function changePreset(
    preset: DatePreset
  ) {
    if (preset === "custom") {
      setDraftFilters((current) => ({
        ...current,
        preset,
      }));

      return;
    }

    const range =
      getDateRange(preset);

    setDraftFilters((current) => ({
      ...current,
      preset,
      ...range,
    }));
  }

  function applyFilters() {
    setAppliedFilters({
      ...draftFilters,
    });
  }

  function resetFilters() {
    const range =
      getDateRange("last30");

    const nextFilters:
      AnalyticsFilterState = {
        homeState: "",
        preset: "last30",
        ...range,
      };

    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }

  if (globalLoading) {
    return <p>Loading analytics...</p>;
  }

  if (globalError) {
    return (
      <p>
        Unable to load global analytics.
      </p>
    );
  }

  const filteredStateLabel =
    appliedFilters.homeState
      ? US_STATES.find(
          (state) =>
            state.code ===
            appliedFilters.homeState
        )?.name ??
        appliedFilters.homeState
      : "All States";

  return (
    <section>
      <p className="eyebrow">Admin</p>
      <h1>Analytics</h1>

      <p className="admin-analytics-page-intro">
        View YakQuest's overall activity,
        then narrow the results by user home
        state and activity date.
      </p>

      <section className="admin-analytics-block">
        <div className="admin-analytics-section-heading">
          <div>
            <p className="eyebrow">
              All Time · Everywhere
            </p>

            <h2>Global Overview</h2>
          </div>

          <p className="muted">
            These totals always represent
            the complete YakQuest platform.
          </p>
        </div>

        <div className="admin-card-grid">
          <div className="admin-stat-card">
            <span>Rivers</span>
            <strong>
              {globalData?.rivers ?? 0}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>Users</span>
            <strong>
              {globalData?.users ?? 0}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>
              Unique Contributors
            </span>
            <strong>
              {globalData
                ?.uniqueContributors ?? 0}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>Saved Trips</span>
            <strong>
              {globalData?.savedTrips ?? 0}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>Completed Trips</span>
            <strong>
              {globalData
                ?.completedTrips ?? 0}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>
              Pending Contributions
            </span>
            <strong>
              {globalData
                ?.pendingContributions ?? 0}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>
              Approved Contributions
            </span>
            <strong>
              {globalData
                ?.approvedContributions ?? 0}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>
              Rejected Contributions
            </span>
            <strong>
              {globalData
                ?.rejectedContributions ?? 0}
            </strong>
          </div>
        </div>

        <div className="admin-analytics-section">
          <div className="admin-analytics-section-heading">
            <div>
              <p className="eyebrow">
                Community Activity
              </p>

              <h2>
                Global Trip Summary
              </h2>
            </div>
          </div>

          <div className="trip-history-stats">
            <div className="trip-history-stat">
              <span>
                Trips Completed
              </span>

              <strong>
                {globalData
                  ?.completedTripSummary
                  .tripsCompleted ?? 0}
              </strong>
            </div>

            <div className="trip-history-stat">
              <span>Actual Miles</span>

              <strong>
                {(
                  globalData
                    ?.completedTripSummary
                    .actualMiles ?? 0
                ).toFixed(2)}
              </strong>
            </div>

            <div className="trip-history-stat">
              <span>Planned Miles</span>

              <strong>
                {(
                  globalData
                    ?.completedTripSummary
                    .plannedMiles ?? 0
                ).toFixed(2)}
              </strong>
            </div>

            <div className="trip-history-stat">
              <span>Time on Water</span>

              <strong>
                {formatElapsedTime(
                  globalData
                    ?.completedTripSummary
                    .elapsedTimeSeconds ?? 0
                )}
              </strong>
            </div>

            <div className="trip-history-stat">
              <span>
                Rivers Explored
              </span>

              <strong>
                {globalData
                  ?.completedTripSummary
                  .riversExplored ?? 0}
              </strong>
            </div>
          </div>

          <CompletedTripsTable
            trips={
              globalData
                ?.completedTripRows ?? []
            }
            emptyMessage="No completed trips have been recorded."
          />
        </div>
      </section>

      <section className="admin-analytics-block admin-analytics-filtered-block">
        <div className="admin-analytics-section-heading">
          <div>
            <p className="eyebrow">
              Segment Analysis
            </p>

            <h2>Filtered Analytics</h2>
          </div>

          <p className="muted">
            Home State selects the users.
            Dates select when their activity
            occurred.
          </p>
        </div>

        <div className="admin-analytics-filter-panel">
          <label>
            <span>Home State</span>

            <select
              value={
                draftFilters.homeState
              }
              onChange={(event) =>
                setDraftFilters(
                  (current) => ({
                    ...current,
                    homeState:
                      event.target.value,
                  })
                )
              }
            >
              <option value="">
                All States
              </option>

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

          <label>
            <span>Date Range</span>

            <select
              value={draftFilters.preset}
              onChange={(event) =>
                changePreset(
                  event.target
                    .value as DatePreset
                )
              }
            >
              <option value="today">
                Today
              </option>

              <option value="last7">
                Last 7 Days
              </option>

              <option value="last30">
                Last 30 Days
              </option>

              <option value="thisMonth">
                This Month
              </option>

              <option value="previousMonth">
                Previous Month
              </option>

              <option value="thisYear">
                This Year
              </option>

              <option value="custom">
                Custom Range
              </option>
            </select>
          </label>

          <label>
            <span>Start Date</span>

            <input
              type="date"
              value={
                draftFilters.startDate
              }
              max={
                draftFilters.endDate
              }
              onChange={(event) =>
                setDraftFilters(
                  (current) => ({
                    ...current,
                    preset: "custom",
                    startDate:
                      event.target.value,
                  })
                )
              }
            />
          </label>

          <label>
            <span>End Date</span>

            <input
              type="date"
              value={
                draftFilters.endDate
              }
              min={
                draftFilters.startDate
              }
              onChange={(event) =>
                setDraftFilters(
                  (current) => ({
                    ...current,
                    preset: "custom",
                    endDate:
                      event.target.value,
                  })
                )
              }
            />
          </label>

          <div className="admin-analytics-filter-actions">
            <button
              type="button"
              className="primary-button"
              onClick={applyFilters}
              disabled={
                !draftFilters.startDate ||
                !draftFilters.endDate ||
                draftFilters.endDate <
                  draftFilters.startDate
              }
            >
              Apply Filters
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="admin-analytics-applied-summary">
          <strong>
            {filteredStateLabel}
          </strong>

          <span>
            {formatDisplayDate(
              `${appliedFilters.startDate}T12:00:00`
            )}
            {" – "}
            {formatDisplayDate(
              `${appliedFilters.endDate}T12:00:00`
            )}
          </span>

          {filteredFetching ? (
            <span>Updating...</span>
          ) : null}
        </div>

        {filteredLoading ? (
          <p>Loading filtered analytics...</p>
        ) : filteredError ? (
          <div
            className="admin-users-message admin-users-message-error"
            role="alert"
          >
            Unable to load filtered
            analytics.
          </div>
        ) : (
          <>
            <div className="admin-analytics-metric-group">
              <div className="admin-analytics-metric-heading">
                <h3>Users</h3>
                <p>
                  Users in the selected
                  home-state cohort.
                </p>
              </div>

              <div className="admin-card-grid">
                <div className="admin-stat-card">
                  <span>
                    Total Users in Cohort
                  </span>
                  <strong>
                    {filteredData
                      ?.users.totalUsers ?? 0}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>
                    New Users
                  </span>
                  <strong>
                    {filteredData
                      ?.users.newUsers ?? 0}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>
                    Active Users
                  </span>
                  <strong>
                    {filteredData
                      ?.users.activeUsers ?? 0}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>
                    Contributing Users
                  </span>
                  <strong>
                    {filteredData
                      ?.users
                      .contributingUsers ?? 0}
                  </strong>
                </div>
              </div>
            </div>

            <div className="admin-analytics-metric-group">
              <div className="admin-analytics-metric-heading">
                <h3>Trips</h3>
                <p>
                  Trips saved or completed
                  during the selected dates.
                </p>
              </div>

              <div className="admin-card-grid">
                <div className="admin-stat-card">
                  <span>Saved Trips</span>
                  <strong>
                    {filteredData
                      ?.trips.savedTrips ?? 0}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>
                    Completed Trips
                  </span>
                  <strong>
                    {filteredData
                      ?.trips
                      .completedTrips ?? 0}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>
                    Planned Miles
                  </span>
                  <strong>
                    {(
                      filteredData
                        ?.trips
                        .plannedMiles ?? 0
                    ).toFixed(2)}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>
                    Actual Miles
                  </span>
                  <strong>
                    {(
                      filteredData
                        ?.trips.actualMiles ??
                      0
                    ).toFixed(2)}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>
                    Time on Water
                  </span>
                  <strong className="admin-stat-card-value-small">
                    {formatElapsedTime(
                      filteredData
                        ?.trips
                        .elapsedTimeSeconds ??
                        0
                    )}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>
                    Rivers Explored
                  </span>
                  <strong>
                    {filteredData
                      ?.trips
                      .riversExplored ?? 0}
                  </strong>
                </div>
              </div>
            </div>

            <div className="admin-analytics-metric-group">
              <div className="admin-analytics-metric-heading">
                <h3>Contributions</h3>
                <p>
                  Contributions submitted
                  during the selected dates.
                </p>
              </div>

              <div className="admin-card-grid">
                <div className="admin-stat-card">
                  <span>Submitted</span>
                  <strong>
                    {filteredData
                      ?.contributions
                      .submitted ?? 0}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>Pending</span>
                  <strong>
                    {filteredData
                      ?.contributions
                      .pending ?? 0}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>Approved</span>
                  <strong>
                    {filteredData
                      ?.contributions
                      .approved ?? 0}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>Rejected</span>
                  <strong>
                    {filteredData
                      ?.contributions
                      .rejected ?? 0}
                  </strong>
                </div>

                <div className="admin-stat-card">
                  <span>
                    Approval Rate
                  </span>
                  <strong>
                    {filteredData
                      ?.contributions
                      .approvalRate == null
                      ? "—"
                      : `${filteredData
                          .contributions
                          .approvalRate.toFixed(
                            1
                          )}%`}
                  </strong>
                </div>
              </div>
            </div>

            <div className="admin-analytics-section">
              <div className="admin-analytics-section-heading">
                <div>
                  <p className="eyebrow">
                    Selected Segment
                  </p>

                  <h2>
                    Completed Trip Summary
                  </h2>
                </div>
              </div>

              <CompletedTripsTable
                trips={
                  filteredData
                    ?.completedTripRows ?? []
                }
                emptyMessage="No completed trips match the selected filters."
              />
            </div>
          </>
        )}
      </section>
    </section>
  );
}