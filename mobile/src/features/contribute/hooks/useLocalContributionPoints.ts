import { useCallback, useEffect, useState } from "react";
import {
  ContributionPoint,
  getLocalContributionPointsForRiver,
} from "../../../services/contributionService";

export function useLocalContributionPoints(riverId?: string | null) {
  const [localPoints, setLocalPoints] = useState<ContributionPoint[]>([]);

  const loadLocalPoints = useCallback(async () => {
    if (!riverId) {
      setLocalPoints([]);
      return;
    }

    const points = await getLocalContributionPointsForRiver(riverId);
    setLocalPoints(points);
  }, [riverId]);

  useEffect(() => {
    loadLocalPoints();
  }, [loadLocalPoints]);

  return {
    localPoints,
    loadLocalPoints,
  };
}