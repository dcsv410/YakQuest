import { useCallback, useEffect, useState } from "react";

import {
  Contribution,
  getContributions,
  saveAndSubmitContribution,
  deleteContribution,
  updateContribution,
  retryContributionSubmission,
  approveContribution,
  rejectContribution,
  getReviewableContributions,
} from "../../../services/contributionService";

export function useContributions() {
  const [contributions, setContributions] = useState<Contribution[]>([]);

  const [reviewableContributions, setReviewableContributions] = useState<
    Contribution[]
  >([]);

  const loadContributions = useCallback(async () => {
    const items = await getContributions();
    setContributions(items);
  }, []);

  const loadReviewableContributions = useCallback(async () => {
    const items = await getReviewableContributions();
    setReviewableContributions(items);
  }, []);

  const approve = async (contributionId: string) => {
    await approveContribution(contributionId);
    await loadContributions();
    await loadReviewableContributions();
  };

  const reject = async (contributionId: string, notes: string) => {
    await rejectContribution(contributionId, notes);
    await loadContributions();
    await loadReviewableContributions();
  };

  const editContribution = async (
    contributionId: string,
    updates: Parameters<typeof updateContribution>[1]
  ) => {
    await updateContribution(contributionId, updates);
    await loadContributions();
  };

  const retryContribution = async (contributionId: string) => {
    const result = await retryContributionSubmission(contributionId);
    await loadContributions();
    return result;
  };

  useEffect(() => {
    loadContributions();
    loadReviewableContributions();
  }, [loadContributions]);

  const saveContribution = async (
    contribution: Parameters<typeof saveAndSubmitContribution>[0]
  ) => {
    const result = await saveAndSubmitContribution(contribution);
    await loadContributions();
    return result;
  };

  const removeContribution = async (contributionId: string) => {
    await deleteContribution(contributionId);
    await loadContributions();
  };

  return {
    contributions,
    loadContributions,
    saveContribution,
    removeContribution,
    editContribution,
    retryContribution,
    reviewableContributions,
    loadReviewableContributions,
    approve,
    reject,
  };
}