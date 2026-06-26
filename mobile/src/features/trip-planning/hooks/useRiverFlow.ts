import { useEffect, useState } from "react";

import {
  fetchUSGSFlow,
  getFlowPercentile,
  getFlowRating,
  getSafetyWarnings,
} from "../utils/flow";

import { River } from "../../../data/types";

export function useRiverFlow(selectedRiver: River | null) {
  const [flowCfs, setFlowCfs] = useState<number | null>(null);

  useEffect(() => {
    const gaugeId = selectedRiver?.usgsGaugeId;

    if (!gaugeId) {
      setFlowCfs(null);
      return;
    }

    const loadFlow = async () => {
      const flow = await fetchUSGSFlow(gaugeId);
      setFlowCfs(flow);
    };

    loadFlow();
  }, [selectedRiver]);

  const flowPercentile =
    flowCfs !== null && selectedRiver?.flowStats
      ? getFlowPercentile(flowCfs, selectedRiver.flowStats)
      : null;

  const flowRating = getFlowRating(flowPercentile);

  const safetyWarnings = getSafetyWarnings(
    flowRating,
    selectedRiver?.difficulty
  );

  return {
    flowCfs,
    flowPercentile,
    flowRating,
    safetyWarnings,
  };
}