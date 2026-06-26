import { useCallback, useEffect, useState } from "react";
import { getApprovedRemovalPointIds } from "../../../services/contributionService";

export function useApprovedRemovalPointIds() {
  const [removedPointIds, setRemovedPointIds] = useState<string[]>([]);

  const loadRemovedPointIds = useCallback(async () => {
    const ids = await getApprovedRemovalPointIds();
    setRemovedPointIds(ids);
  }, []);

  useEffect(() => {
    loadRemovedPointIds();
  }, [loadRemovedPointIds]);

  return {
    removedPointIds,
    loadRemovedPointIds,
  };
}