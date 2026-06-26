import { useState } from "react";
import { River, RiverPoint } from "../../../data/types";

export function useTripPlanner() {
  const [selectedRiver, setSelectedRiver] = useState<River | null>(null);

  const [start, setStart] = useState<RiverPoint | null>(null);
  const [end, setEnd] = useState<RiverPoint | null>(null);

  const [selectMode, setSelectMode] = useState<"start" | "end">("start");

  const [showOverview, setShowOverview] = useState(false);
  const [showSafetyScreen, setShowSafetyScreen] = useState(false);
  const [showShuttleScreen, setShowShuttleScreen] = useState(false);

  const [tripActive, setTripActive] = useState(false);
  const [navigationArmed, setNavigationArmed] = useState(false);

  const [navigationTarget, setNavigationTarget] =
    useState<RiverPoint | null>(null);

  const selectRiver = (river: River) => {
    setSelectedRiver(river);
    resetTrip();
  };

  const selectStart = (point: RiverPoint) => {
    setStart(point);
    setSelectMode("end");
  };

  const selectEnd = (point: RiverPoint) => {
    setEnd(point);
  };

  const showTripOverview = () => {
    setShowOverview(true);
  };

  const beginStartTripFlow = () => {
    setShowOverview(false);
    setShowSafetyScreen(true);
    setShowShuttleScreen(false);
  };

  const continueFromSafety = () => {
    setShowOverview(false);
    setShowSafetyScreen(false);
    setShowShuttleScreen(true);
  };

  const navigateToStart = () => {
    setNavigationTarget(start);
  };

  const navigateToEnd = () => {
    setNavigationTarget(end);
  };

  const alreadyAtLaunch = () => {
    setShowOverview(false);
    setShowSafetyScreen(false);
    setShowShuttleScreen(false);
    setTripActive(true);
    setNavigationArmed(false);
  };

  const beginPaddling = () => {
    setShowOverview(false);
    setShowSafetyScreen(false);
    setShowShuttleScreen(false);
    setNavigationArmed(true);
  };

  const completeTrip = () => {
    setTripActive(false);
  };

  const resetTrip = () => {
    setStart(null);
    setEnd(null);
    setSelectMode("start");

    setShowOverview(false);
    setShowSafetyScreen(false);
    setShowShuttleScreen(false);

    setTripActive(false);
    setNavigationArmed(false);
    setNavigationTarget(null);
  };

  const loadSavedTrip = (
    river: River,
    savedStart: RiverPoint,
    savedEnd: RiverPoint
  ) => {
    setSelectedRiver(river);
    setStart(savedStart);
    setEnd(savedEnd);
    setSelectMode("end");
    setShowOverview(true);

    setShowSafetyScreen(false);
    setShowShuttleScreen(false);
    setTripActive(false);
    setNavigationArmed(false);
    setNavigationTarget(null);
  };

  return {
    selectedRiver,
    start,
    end,
    selectMode,

    showOverview,
    showSafetyScreen,
    showShuttleScreen,

    tripActive,
    navigationArmed,
    navigationTarget,

    selectRiver,
    selectStart,
    selectEnd,

    showTripOverview,
    beginStartTripFlow,
    continueFromSafety,

    navigateToStart,
    navigateToEnd,
    alreadyAtLaunch,
    beginPaddling,
    completeTrip,

    resetTrip,
    loadSavedTrip,
  };
}