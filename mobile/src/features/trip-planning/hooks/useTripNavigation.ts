import { useEffect, useRef, useState } from "react";
import { Alert, AppState } from "react-native";

import { River, RiverPoint, Coordinate } from "../../../data/types";
import { distanceFeet } from "@yakquest/shared";
import {
  getRemainingRiverDistanceFeet,
  getNextRiverPointByPath,
} from "../utils/tripMath";
import { sendNavigationNotification } from "../../../services/notificationService";
import {
  getAllRiverPoints,
  getAverageSpeedMph,
  getEtaFromSpeed,
} from "@yakquest/shared";

const NAV_ALERTS = {
  pointApproachFeet: 500,
  oneMileFeet: 2640,
  halfMileFeet: 1320,
  completeFeet: 150,
};

type Params = {
  location: Coordinate | null;
  selectedRiver: River | null;
  end: RiverPoint | null;
  tripActive: boolean;
  navigationArmed: boolean;
  localPoints?: RiverPoint[];
  onTripComplete: (summary: {
    actualDistanceFeet: number;
    elapsedMs: number;
  }) => void;
};

export function useTripNavigation({
  location,
  selectedRiver,
  end,
  tripActive,
  navigationArmed,
  localPoints = [],
  onTripComplete,
}: Params) {
  const visitedPointsRef = useRef(new Set<string>());

  const [distanceToEndFeet, setDistanceToEndFeet] =
    useState<number | null>(null);

  const [nextPoint, setNextPoint] = useState<RiverPoint | null>(null);

  const [distanceToNextPointFeet, setDistanceToNextPointFeet] =
    useState<number | null>(null);

  const [approachingPoint, setApproachingPoint] =
    useState<RiverPoint | null>(null);

  const [mileAlertSent, setMileAlertSent] = useState(false);
  const [halfMileAlertSent, setHalfMileAlertSent] = useState(false);
  const [tripCompleteAlertSent, setTripCompleteAlertSent] = useState(false);

  const tripStartTimeRef = useRef<number | null>(null);
  const previousLocationRef = useRef<Coordinate | null>(null);
  const actualDistanceFeetRef = useRef(0);
  const onTripCompleteRef = useRef(onTripComplete);

  const [averageSpeedMph, setAverageSpeedMph] = useState(0);
  const [estimatedTimeRemainingMs, setEstimatedTimeRemainingMs] =
    useState<number | null>(null);

  const notifyOrAlert = async (title: string, message: string) => {
    if (AppState.currentState === "active") {
      Alert.alert(title, message);
      return;
    }

    await sendNavigationNotification(title, message);
  };

  useEffect(() => {
    onTripCompleteRef.current = onTripComplete;
  }, [onTripComplete]);

  useEffect(() => {
    if (!tripActive || !navigationArmed || !location) return;

    if (!tripStartTimeRef.current) {
      tripStartTimeRef.current = Date.now();
      previousLocationRef.current = location;
      actualDistanceFeetRef.current = 0;
      return;
    }

    if (previousLocationRef.current) {
      const movedFeet = distanceFeet(previousLocationRef.current, location);

      if (movedFeet > 10 && movedFeet < 1000) {
        actualDistanceFeetRef.current += movedFeet;
      }
    }

    previousLocationRef.current = location;
  }, [location, tripActive, navigationArmed]);

  useEffect(() => {
    if (
      !tripActive ||
      !navigationArmed ||
      !location ||
      !selectedRiver ||
      !end
    ) {
      return;
    }

    const proximityDist = distanceFeet(location, end);

    const riverDist = getRemainingRiverDistanceFeet(
      selectedRiver,
      location,
      end
    );

    setDistanceToEndFeet(riverDist);

    const elapsedMs = tripStartTimeRef.current
      ? Date.now() - tripStartTimeRef.current
      : 0;

    const avgSpeed = getAverageSpeedMph(
      actualDistanceFeetRef.current,
      elapsedMs
    );

    setAverageSpeedMph(avgSpeed);

    setEstimatedTimeRemainingMs(
      getEtaFromSpeed(riverDist, avgSpeed)
    );

    if (riverDist  < NAV_ALERTS.oneMileFeet && !mileAlertSent) {
      setMileAlertSent(true);

      notifyOrAlert(
        "Take-out Ahead",
        "Take-out is getting close."
      );
    }

    if (riverDist  < NAV_ALERTS.halfMileFeet && !halfMileAlertSent) {
      setHalfMileAlertSent(true);

      notifyOrAlert("Prepare To Exit", "Take-out is ahead.");
    }

    if (proximityDist  < NAV_ALERTS.completeFeet && !tripCompleteAlertSent) {
      setTripCompleteAlertSent(true);

      notifyOrAlert(
        "Trip Complete",
        "You have arrived at your destination."
      );

      onTripCompleteRef.current({
        actualDistanceFeet: actualDistanceFeetRef.current,
        elapsedMs: tripStartTimeRef.current
          ? Date.now() - tripStartTimeRef.current
          : 0,
      });
    }
  }, [
    location,
    selectedRiver,
    end,
    tripActive,
    navigationArmed,
    mileAlertSent,
    halfMileAlertSent,
    tripCompleteAlertSent,
  ]);

  useEffect(() => {
    if (
      !tripActive ||
      !navigationArmed ||
      !location ||
      !selectedRiver
    ) {
      return;
    }

    const points = [
      ...getAllRiverPoints(selectedRiver),
      ...localPoints,
    ];

    const unvisitedPoints = points.filter(
      (p) => !visitedPointsRef.current.has(p.id)
    );

    const next = getNextRiverPointByPath(
      selectedRiver,
      location,
      unvisitedPoints
    );

    setNextPoint(next?.point ?? null);
    setDistanceToNextPointFeet(next?.distanceFeet ?? null);

    points.forEach((p) => {
      const dist = distanceFeet(location, p);

      if (
        dist < NAV_ALERTS.pointApproachFeet &&
        !visitedPointsRef.current.has(p.id)
      ) {
        setApproachingPoint(p);
        notifyOrAlert("Approaching", p.name);
        visitedPointsRef.current.add(p.id);
      }
    });
  }, [location, selectedRiver, tripActive, navigationArmed, localPoints]);

  const resetNavigationAlerts = () => {
    setMileAlertSent(false);
    setHalfMileAlertSent(false);
    setTripCompleteAlertSent(false);
    setApproachingPoint(null);
    setDistanceToEndFeet(null);
    setNextPoint(null);
    setDistanceToNextPointFeet(null);
    visitedPointsRef.current.clear();
    tripStartTimeRef.current = null;
    previousLocationRef.current = null;
    actualDistanceFeetRef.current = 0;
    setAverageSpeedMph(0);
    setEstimatedTimeRemainingMs(null);
  };

  return {
    approachingPoint,
    distanceToEndFeet,
    nextPoint,
    distanceToNextPointFeet,
    averageSpeedMph,
    estimatedTimeRemainingMs,
    resetNavigationAlerts,
  };
}