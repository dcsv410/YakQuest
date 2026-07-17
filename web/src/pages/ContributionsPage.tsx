import { useQuery } from "@tanstack/react-query";
import type {
  ContributionResponseDTO,
} from "@yakquest/shared";

import {
  fetchMyContributions,
} from "../services/contributionService";

function formatContributionKind(
  kind: ContributionResponseDTO["kind"]
) {
  switch (kind) {
    case "new-river":
      return "New River Request";

    case "existing-river-point":
      return "River Point";

    case "remove-existing-point":
      return "Point Removal";

    case "point-photo":
      return "Point Photo";

    default:
      return kind;
  }
}

function formatContributionStatus(
  status: ContributionResponseDTO["status"]
) {
  switch (status) {
    case "pending":
      return "Pending Review";

    case "submitted":
      return "Submitted";

    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "failed":
      return "Submission Failed";

    default:
      return status;
  }
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

function getContributionSummary(
  contribution: ContributionResponseDTO
) {
  if (
    contribution.kind ===
    "new-river"
  ) {
    return contribution.description
      ? contribution.description
      : "Requested that this river be added to YakQuest.";
  }

  if (
    contribution.kind ===
    "existing-river-point"
  ) {
    const pointCount =
      contribution.points?.length ?? 0;

    return pointCount === 1
      ? "Submitted one river point."
      : `Submitted ${pointCount} river points.`;
  }

  if (
    contribution.kind ===
    "remove-existing-point"
  ) {
    return contribution.removal_reason
      ? contribution.removal_reason
      : "Requested removal of an existing point.";
  }

  if (
    contribution.kind ===
    "point-photo"
  ) {
    return contribution.photo_caption
      ? contribution.photo_caption
      : "Submitted a photo for a river point.";
  }

  return "Contribution submitted.";
}

export default function ContributionsPage() {
  const {
    data: contributions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["myContributions"],
    queryFn: fetchMyContributions,
  });

  if (isLoading) {
    return (
      <section>
        <p className="eyebrow">
          Contributions
        </p>

        <h1>Your Contributions</h1>

        <p className="muted">
          Loading your contributions...
        </p>
      </section>
    );
  }

  if (error) {
    console.error(
      "Failed to load contributions:",
      error
    );

    return (
      <section>
        <p className="eyebrow">
          Contributions
        </p>

        <h1>Your Contributions</h1>

        <div className="page-error">
          <p>
            We were unable to load your
            contributions.
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void refetch();
            }}
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  const approvedCount =
    contributions.filter(
      (contribution) =>
        contribution.status ===
        "approved"
    ).length;

  const pendingCount =
    contributions.filter(
      (contribution) =>
        contribution.status ===
          "pending" ||
        contribution.status ===
          "submitted"
    ).length;

  const rejectedCount =
    contributions.filter(
      (contribution) =>
        contribution.status ===
        "rejected"
    ).length;

  return (
    <section>
      <p className="eyebrow">
        Contributions
      </p>

      <h1>Your Contributions</h1>

      <p className="muted">
        Track the river information,
        access points, removal requests,
        and photos you have submitted.
      </p>

      <div className="contribution-stats">
        <div className="contribution-stat">
          <span>Total Submitted</span>

          <strong>
            {contributions.length}
          </strong>
        </div>

        <div className="contribution-stat">
          <span>Approved</span>

          <strong>
            {approvedCount}
          </strong>
        </div>

        <div className="contribution-stat">
          <span>Pending</span>

          <strong>
            {pendingCount}
          </strong>
        </div>

        <div className="contribution-stat">
          <span>Rejected</span>

          <strong>
            {rejectedCount}
          </strong>
        </div>
      </div>

      {contributions.length === 0 ? (
        <div className="contributions-empty">
          <h2>
            No contributions yet
          </h2>

          <p className="muted">
            River requests, access
            points, corrections, and
            photos you submit will appear
            here.
          </p>
        </div>
      ) : (
        <div className="contribution-list">
          {contributions.map(
            (contribution) => (
              <article
                key={contribution.id}
                className="contribution-card"
              >
                <div className="contribution-card-header">
                  <div>
                    <p className="eyebrow">
                      {formatContributionKind(
                        contribution.kind
                      )}
                    </p>

                    <h2>
                      {contribution.river_name}
                    </h2>

                    {contribution.state ? (
                      <p className="muted">
                        {contribution.state}
                      </p>
                    ) : null}
                  </div>

                  <span
                    className={[
                      "contribution-status",
                      `contribution-status-${contribution.status}`,
                    ].join(" ")}
                  >
                    {formatContributionStatus(
                      contribution.status
                    )}
                  </span>
                </div>

                <p className="contribution-summary">
                  {getContributionSummary(
                    contribution
                  )}
                </p>

                {contribution.target_point_name ? (
                  <p className="contribution-detail">
                    <strong>
                      Point:
                    </strong>{" "}
                    {
                      contribution.target_point_name
                    }
                  </p>
                ) : null}

                {contribution.review_notes ? (
                  <div className="contribution-review-notes">
                    <strong>
                      Review notes
                    </strong>

                    <p>
                      {
                        contribution.review_notes
                      }
                    </p>
                  </div>
                ) : null}

                <div className="contribution-card-footer">
                  <span>
                    Submitted{" "}
                    {formatDate(
                      contribution.created_at
                    )}
                  </span>

                  {contribution.reviewed_at ? (
                    <span>
                      Reviewed{" "}
                      {formatDate(
                        contribution.reviewed_at
                      )}
                    </span>
                  ) : null}
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}