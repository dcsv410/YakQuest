import AsyncStorage from "@react-native-async-storage/async-storage";
import { Coordinate, RiverPointType } from "../data/types";
import { API_URL } from "../config";
import { getToken } from "./authService";

const CONTRIBUTIONS_KEY = "yakquest:contributions";
const CONTRIBUTIONS_ENDPOINT = `${API_URL}/contributions`;

export type ContributionStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "failed";

export type ContributionKind =
  | "new-river"
  | "existing-river-point"
  | "remove-existing-point"
  | "point-photo";

const toApiContribution = (contribution: Contribution) => ({
  kind: contribution.kind,
  riverId: contribution.riverId,
  riverName: contribution.riverName,
  state: contribution.state,
  points: contribution.points,
  targetPointId: contribution.targetPointId,
  targetPointName: contribution.targetPointName,
  removalReason: contribution.removalReason,
  photoUri: contribution.photoUri ?? null,
  photoCaption: contribution.photoCaption ?? null,
});

export type ContributionPoint = Coordinate & {
  id: string;
  name: string;
  type: RiverPointType;
  description?: string;
  parking?: boolean;
  restroom?: boolean;
  camping?: boolean;
  hazardType?: string;
  poiType?: string;
};

export type Contribution = {
  id: string;
  kind: ContributionKind;
  status: ContributionStatus;
  riverId?: string;
  riverName: string;
  state?: string;
  description?: string;
  points: ContributionPoint[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  trustedAutoApproved?: boolean;
  targetPointId?: string;
  targetPointName?: string;
  removalReason?: string;
  photoUri?: string | null;
  photoCaption?: string | null;
  backendId?: string;
};

export const approveContribution = async (
  contributionId: string,
  reviewedBy = "local-admin"
) => {
  await updateContribution(contributionId, {
    status: "approved",
    reviewedAt: new Date().toISOString(),
    reviewedBy,
    reviewNotes: undefined,
  });
};

export const rejectContribution = async (
  contributionId: string,
  reviewNotes: string,
  reviewedBy = "local-admin"
) => {
  await updateContribution(contributionId, {
    status: "rejected",
    reviewedAt: new Date().toISOString(),
    reviewedBy,
    reviewNotes,
  });
};

export const getReviewableContributions = async () => {
  await syncContributionStatusesFromBackend();

  const contributions = await getContributions();

  return contributions.filter(
    (item) =>
      item.status === "pending" ||
      item.status === "submitted" ||
      item.status === "failed"
  );
};

export const getApprovedRemovalPointIds = async (): Promise<string[]> => {
  return [];
};

export const updateContribution = async (
  contributionId: string,
  updates: Partial<Contribution>
) => {
  const contributions = await getContributions();

  const updated = contributions.map((item) =>
    item.id === contributionId
      ? {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  await AsyncStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(updated));
};

export const retryContributionSubmission = async (
  contributionId: string
): Promise<boolean> => {
  const contributions = await getContributions();
  const contribution = contributions.find((item) => item.id === contributionId);

  if (!contribution) return false;

  await updateContributionStatus(contributionId, "pending");

  return submitContributionForReview(contribution);
};

export const getContributions = async (): Promise<Contribution[]> => {
  const raw = await AsyncStorage.getItem(CONTRIBUTIONS_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveContributionLocally = async (
  contribution: Omit<
    Contribution,
    "id" | "status" | "createdAt" | "updatedAt"
  >
): Promise<Contribution> => {
  const contributions = await getContributions();

  const now = new Date().toISOString();

  const saved: Contribution = {
    ...contribution,
    id: `contribution-${Date.now()}`,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await AsyncStorage.setItem(
    CONTRIBUTIONS_KEY,
    JSON.stringify([saved, ...contributions])
  );

  return saved;
};

export const updateContributionStatus = async (
  contributionId: string,
  status: ContributionStatus
) => {
  const contributions = await getContributions();

  const updated = contributions.map((item) =>
    item.id === contributionId
      ? {
          ...item,
          status,
          updatedAt: new Date().toISOString(),
          submittedAt:
            status === "submitted"
              ? new Date().toISOString()
              : item.submittedAt,
        }
      : item
  );

  await AsyncStorage.setItem(
    CONTRIBUTIONS_KEY,
    JSON.stringify(updated)
  );
};

export const deleteContribution = async (contributionId: string) => {
  const contributions = await getContributions();

  await AsyncStorage.setItem(
    CONTRIBUTIONS_KEY,
    JSON.stringify(
      contributions.filter((item) => item.id !== contributionId)
    )
  );
};

export const submitContributionForReview = async (
  contribution: Contribution
): Promise<boolean> => {
  try {
    const token = await getToken();

    if (!token) {
      console.error(
        "Contribution submission failed: no authentication token was found."
      );

      await updateContributionStatus(
        contribution.id,
        "failed"
      );

      return false;
    }

    const res = await fetch(
      CONTRIBUTIONS_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          toApiContribution(contribution)
        ),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();

      console.error(
        "Contribution submission failed:",
        errorText
      );

      await updateContributionStatus(
        contribution.id,
        "failed"
      );

      return false;
    }

    const backendContribution =
      await res.json();

    await updateContribution(
      contribution.id,
      {
        status: "submitted",
        submittedAt:
          new Date().toISOString(),
        backendId:
          backendContribution.id,
      }
    );

    return true;
  } catch (error) {
    console.error(
      "Contribution submission error:",
      error
    );

    await updateContributionStatus(
      contribution.id,
      "failed"
    );

    return false;
  }
};

// export const syncContributionStatusesFromBackend = async () => {
//   const localContributions = await getContributions();

//   const res = await fetch(`${API_URL}/admin/contributions`);

//   if (!res.ok) {
//     throw new Error("Failed to fetch backend contributions");
//   }

//   const backendContributions = await res.json();

//   const updated = localContributions.map((local) => {
//     if (!local.backendId) return local;

//     const backend = backendContributions.find(
//       (item: any) => item.id === local.backendId
//     );

//     if (!backend) return local;

//     return {
//       ...local,
//       status: backend.status,
//       reviewedAt:
//         backend.status === "approved" || backend.status === "rejected"
//           ? backend.reviewed_at ?? new Date().toISOString()
//           : local.reviewedAt,
//       updatedAt: new Date().toISOString(),
//     };
//   });

//   await AsyncStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(updated));
// };

export const syncContributionStatusesFromBackend = async () => {
  const localContributions = await getContributions();

  const submittedContributions = localContributions.filter(
    (contribution) => contribution.backendId
  );

  // Nothing has reached the backend yet, so there is nothing to synchronize.
  if (submittedContributions.length === 0) {
    return;
  }

  // Do not call /admin/contributions from the mobile client.
  // We will replace this with a user-scoped endpoint.
  return;
};

export const saveAndSubmitContribution = async (
  contribution: Omit<
    Contribution,
    "id" | "status" | "createdAt" | "updatedAt"
  >
) => {
  const saved = await saveContributionLocally(contribution);
  const submitted = await submitContributionForReview(saved);

  return {
    contribution: saved,
    submitted,
  };
};

export const getLocalContributionPointsForRiver = async (
  riverId: string
): Promise<ContributionPoint[]> => {
  return [];
};