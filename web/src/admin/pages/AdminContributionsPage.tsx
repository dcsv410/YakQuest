import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import type { ContributionResponseDTO } from "@yakquest/shared";

import {
  approveContribution,
  fetchAdminContributions,
  rejectContribution,
} from "../../services/contributionService";
import { fetchRivers } from "../../services/riverService";
import FitRiverBounds from "../../components/FitRiverBounds";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

function pointIcon(className: string) {
  return L.divIcon({
    className: `admin-map-marker ${className}`,
    html: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const existingPointIcon = pointIcon("admin-marker-default");
const contributionPointIcon = pointIcon("admin-marker-new");

export default function AdminContributionsPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("pending");
  const [selectedContributionId, setSelectedContributionId] =
    useState<string>("");

  const {
    data: contributions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminContributions"],
    queryFn: fetchAdminContributions,
  });

  const { data: rivers = [] } = useQuery({
    queryKey: ["rivers"],
    queryFn: fetchRivers,
  });

  const filtered = useMemo(() => {
    if (statusFilter === "all") return contributions;

    return contributions.filter(
      (contribution) => contribution.status === statusFilter
    );
  }, [contributions, statusFilter]);

  const contributionCounts = useMemo(() => {
    return {
      pending: contributions.filter((item) => item.status === "pending").length,
      approved: contributions.filter((item) => item.status === "approved").length,
      rejected: contributions.filter((item) => item.status === "rejected").length,
      all: contributions.length,
    };
  }, [contributions]);

  const selectedContribution =
    contributions.find((item) => item.id === selectedContributionId) ??
    filtered[0];

  const selectedRiver = selectedContribution?.river_id
    ? rivers.find((river) => river.id === selectedContribution.river_id)
    : rivers.find(
        (river) =>
          river.name === selectedContribution?.river_name &&
          river.state === selectedContribution?.state
      );

  const contributionMapCenter: [number, number] =
    selectedContribution?.points[0]
      ? [
          selectedContribution.points[0].latitude,
          selectedContribution.points[0].longitude,
        ]
      : selectedRiver?.coordinates[0]
      ? [
          selectedRiver.coordinates[0].latitude,
          selectedRiver.coordinates[0].longitude,
        ]
      : [35.1, -86.5];

  async function refresh() {
    await queryClient.invalidateQueries({
      queryKey: ["adminContributions"],
    });

    await queryClient.invalidateQueries({
      queryKey: ["rivers"],
    });
  }

  async function approve(contribution: ContributionResponseDTO) {
    try {
      await approveContribution(contribution.id);
      await refresh();
    } catch (error) {
      console.error("Failed to approve contribution:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to approve the contribution."
      );
    }
  }

  async function reject(contribution: ContributionResponseDTO) {
    try {
      await rejectContribution(contribution.id);
      await refresh();
    } catch (error) {
      console.error("Failed to reject contribution:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to reject the contribution."
      );
    }
  }

  if (isLoading) {
    return <p>Loading contributions...</p>;
  }

  if (error) {
    return <p>Unable to load contributions.</p>;
  }

  return (
    <section className="admin-contributions-page">
      <div className="admin-contributions-left">
        <p className="eyebrow">Admin</p>
        <h1>Contributions</h1>

        <div className="admin-filter-row">
          {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map(
            (status) => (
              <button
                key={status}
                type="button"
                className={statusFilter === status ? "active" : ""}
                onClick={() => {
                  setStatusFilter(status);
                  setSelectedContributionId("");
                }}
              >
                {status} ({contributionCounts[status]})
              </button>
            )
          )}
        </div>

        <div className="admin-contribution-list">
          {filtered.length ? (
            filtered.map((contribution) => (
              <div
                key={contribution.id}
                className={`admin-contribution-card ${
                  contribution.id === selectedContribution?.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => setSelectedContributionId(contribution.id)}
              >
                <div>
                  <p className="eyebrow">{contribution.status}</p>
                  <h2>{contribution.river_name}</h2>
                  <p className="muted">
                    {contribution.kind}
                  </p>

                  <div className="admin-contribution-submitter">
                    <div>
                      <span className="admin-contribution-submitter-label">
                        Submitted by
                      </span>

                      <strong>
                        {contribution.submitter_name ??
                          "Unknown user"}
                      </strong>

                      {contribution.submitter_email &&
                      contribution.submitter_email !==
                        contribution.submitter_name ? (
                        <span className="admin-contribution-submitter-email">
                          {contribution.submitter_email}
                        </span>
                      ) : null}
                    </div>

                    <div className="admin-contribution-trust">
                      <span>Trust Score</span>

                      <strong>
                        {contribution.submitter_trust_score ??
                          "—"}
                      </strong>
                    </div>
                  </div>

                  {contribution.state ? (
                    <p>
                      <strong>State:</strong> {contribution.state}
                    </p>
                  ) : null}

                  {contribution.description ? (
                    <div className="admin-contribution-description">
                      <strong>Request details:</strong>
                      <p>{contribution.description}</p>
                    </div>
                  ) : null}

                  {contribution.target_point_name ? (
                    <p>
                      <strong>Target:</strong>{" "}
                      {contribution.target_point_name}
                    </p>
                  ) : null}

                  {contribution.removal_reason ? (
                    <p>
                      <strong>Removal reason:</strong>{" "}
                      {contribution.removal_reason}
                    </p>
                  ) : null}

                  {contribution.photo_uri ? (
                    <div className="admin-contribution-photo-preview">
                      <img
                        src={contribution.photo_uri}
                        alt={`Submitted photo for ${
                          contribution.target_point_name ??
                          contribution.river_name ??
                          "contribution"
                        }`}
                        className="admin-contribution-photo-image"
                      />
                    </div>
                  ) : null}

                  {contribution.points.length ? (
                    <div className="admin-contribution-points">
                      <strong>Points</strong>

                      {contribution.points.map((point, index) => (
                        <div key={point.id ?? index}>
                          <p>
                            {point.name} · {point.type}
                          </p>
                          <small>
                            {point.latitude.toFixed(6)},{" "}
                            {point.longitude.toFixed(6)}
                          </small>
                          {point.description ? (
                            <p className="muted">{point.description}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="admin-contribution-actions">
                  {contribution.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          approve(contribution);
                        }}
                      >
                        Approve & Add to River
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          reject(contribution);
                        }}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {contribution.status === "approved" ? (
                    <span className="status-pill approved">Approved</span>
                  ) : null}

                  {contribution.status === "rejected" ? (
                    <span className="status-pill rejected">Rejected</span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="muted">No contributions match this filter.</p>
          )}
        </div>
      </div>

      <div className="admin-contributions-map-panel">
        <div className="admin-map-legend">
          <div>
            <span className="legend-dot admin-marker-default" />
            Existing Point
          </div>

          <div>
            <span className="legend-dot admin-marker-new" />
            Submitted Point
          </div>
        </div>
        {!selectedContribution ? (
          <div className="admin-map-empty-state">
            Select a contribution to preview it.
          </div>
        ) : null}
        <MapContainer
          center={contributionMapCenter}
          zoom={12}
          scrollWheelZoom
          className="admin-contributions-map"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {selectedRiver ? (
            <>
              <FitRiverBounds coordinates={selectedRiver.coordinates} />

              <Polyline
                positions={selectedRiver.coordinates.map((coord) => [
                  coord.latitude,
                  coord.longitude,
                ])}
                pathOptions={{
                  weight: 5,
                  opacity: 0.7,
                }}
              />
            </>
          ) : null}

          {selectedRiver
            ? [
                ...selectedRiver.accessPoints.public,
                ...selectedRiver.accessPoints.private,
                ...selectedRiver.pois,
                ...(selectedRiver.hazards ?? []),
              ].map((point) => (
                <Marker
                  key={point.id}
                  position={[point.latitude, point.longitude]}
                  icon={existingPointIcon}
                >
                  <Popup>
                    <strong>{point.name}</strong>
                    <br />
                    Existing: {point.type}
                  </Popup>
                </Marker>
              ))
            : null}

          {selectedContribution?.points.map((point, index) => (
            <Marker
              key={point.id ?? index}
              position={[point.latitude, point.longitude]}
              icon={contributionPointIcon}
            >
              <Popup>
                <strong>{point.name}</strong>
                <br />
                {point.type}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}