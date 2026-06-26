import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addRecentRiverId,
  getRecentRiverIds,
  clearRecentRivers,
} from "../../../../src/services/recentRiverService";

import { getRiverById } from "../../../../src/services/riverService";
import { River } from "../../../data/types";

export function useRecentRivers() {
  const [recentRiverIds, setRecentRiverIds] = useState<string[]>([]);

  const loadRecentRivers = useCallback(async () => {
    const ids = await getRecentRiverIds();
    setRecentRiverIds(ids);
  }, []);

  useEffect(() => {
    loadRecentRivers();
  }, [loadRecentRivers]);

  const recentRivers = useMemo(() => {
    return recentRiverIds
      .map((id) => getRiverById(id))
      .filter(Boolean) as River[];
  }, [recentRiverIds]);

  const addRecentRiver = async (river: River) => {
    const updated = await addRecentRiverId(river.id);
    setRecentRiverIds(updated);
  };

  const clearRecentRiverList = async () => {
    await clearRecentRivers();
    setRecentRiverIds([]);
  };

  return {
    recentRivers,
    addRecentRiver,
    clearRecentRiverList,
    loadRecentRivers,
  };
}