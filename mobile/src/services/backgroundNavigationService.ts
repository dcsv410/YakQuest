import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getRiverById } from "./riverService";
import { sendNavigationNotification } from "./notificationService";
import { Coordinate, RiverPoint } from "../data/types";
import { distanceFeet, getAllRiverPoints } from "@yakquest/shared";
import {
  getRemainingRiverDistanceFeet,
} from "../features/trip-planning/utils/tripMath";

const TASK_NAME = "yakquest-background-navigation";
const ACTIVE_NAV_KEY = "yakquest:activeBackgroundNavigation";
const ALERTED_POINTS_KEY = "yakquest:backgroundAlertedPoints";
const BACKGROUND_COMPLETED_TRIP_KEY = "yakquest:backgroundCompletedTrip";
const LIVE_TASK_NAME = "yakquest-background-live-navigation";
const ACTIVE_LIVE_NAV_KEY = "yakquest:activeBackgroundLiveNavigation";
const LIVE_ALERTED_POINTS_KEY = "yakquest:backgroundLiveAlertedPoints";

const NAV_ALERTS = {
  pointApproachFeet: 500,
  oneMileFeet: 2640,
  halfMileFeet: 1320,
  completeFeet: 150,
};

type ActiveBackgroundNavigation = {
  riverId: string;
  end: RiverPoint;
  localPoints: RiverPoint[];
  startedAt: string;
};

type StartBackgroundNavigationInput = {
  riverId: string;
  end: RiverPoint;
  localPoints: RiverPoint[];
};

type ActiveBackgroundLiveNavigation = {
  riverId: string;
  localPoints: RiverPoint[];
};

const getAlertedIds = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(ALERTED_POINTS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveAlertedIds = async (ids: string[]) => {
  await AsyncStorage.setItem(ALERTED_POINTS_KEY, JSON.stringify(ids));
};

const getLiveAlertedIds = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(LIVE_ALERTED_POINTS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveLiveAlertedIds = async (ids: string[]) => {
  await AsyncStorage.setItem(
    LIVE_ALERTED_POINTS_KEY,
    JSON.stringify(ids)
  );
};

TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error) {
    return;
  }

  const locations = (data as any)?.locations as Location.LocationObject[];

  const latest = locations?.[0];

  if (!latest) return;

  const rawSession = await AsyncStorage.getItem(ACTIVE_NAV_KEY);
  if (!rawSession) return;

  const session: ActiveBackgroundNavigation = JSON.parse(rawSession);

  const river = getRiverById(session.riverId);
  if (!river) return;

  const location: Coordinate = {
    latitude: latest.coords.latitude,
    longitude: latest.coords.longitude,
  };

  const alertedIds = await getAlertedIds();

  const allPoints = [
    ...getAllRiverPoints(river),
    ...(session.localPoints ?? []),
  ];

  const isEndPoint = (point: RiverPoint) =>
    point.id === session.end.id;

  const markAlerted = async (id: string) => {
    alertedIds.push(id);
    await saveAlertedIds(alertedIds);
  };

  for (const point of allPoints) {
    if (isEndPoint(point)) continue;
    if (alertedIds.includes(point.id)) continue;

    const proximityFeet = distanceFeet(location, point);

    if (proximityFeet < NAV_ALERTS.pointApproachFeet) {
      await sendNavigationNotification(
        `Approaching ${point.name}`,
        point.description || "You are approaching a point on your route."
      );

      await markAlerted(point.id);
    }
  }

  const distanceToEndFeet = getRemainingRiverDistanceFeet(
    river,
    location,
    session.end
  );

  const proximityToEndFeet = distanceFeet(location, session.end);

  if (
    distanceToEndFeet < NAV_ALERTS.oneMileFeet &&
    !alertedIds.includes("takeout-0.5mi")
  ) {
    await sendNavigationNotification(
      "Take-out Ahead",
      "Your take-out is about 0.5 miles ahead."
    );

    await markAlerted("takeout-0.5mi");
  }

  if (
    distanceToEndFeet < NAV_ALERTS.halfMileFeet &&
    !alertedIds.includes("takeout-0.25mi")
  ) {
    await sendNavigationNotification(
      "Prepare To Exit",
      "Your take-out is about 0.25 miles ahead."
    );

    await markAlerted("takeout-0.25mi");
  }

  if (
    proximityToEndFeet < NAV_ALERTS.completeFeet &&
    !alertedIds.includes("trip-complete")
  ) {
    await sendNavigationNotification(
      "Trip Complete",
      "You have arrived at your take-out."
    );

    await markAlerted("trip-complete");

    await AsyncStorage.setItem(
      BACKGROUND_COMPLETED_TRIP_KEY,
      JSON.stringify({
        completedAt: new Date().toISOString(),
        startedAt: session.startedAt,
        riverId: session.riverId,
        end: session.end,
      })
    );

    await stopBackgroundNavigation();
  }
});

TaskManager.defineTask(LIVE_TASK_NAME, async ({ data, error }) => {
  if (error) return;

  const locations = (data as any)?.locations as Location.LocationObject[];
  const latest = locations?.[0];
  if (!latest) return;

  const rawSession = await AsyncStorage.getItem(ACTIVE_LIVE_NAV_KEY);
  if (!rawSession) return;

  const session: ActiveBackgroundLiveNavigation = JSON.parse(rawSession);

  const river = getRiverById(session.riverId);
  if (!river) return;

  const location: Coordinate = {
    latitude: latest.coords.latitude,
    longitude: latest.coords.longitude,
  };

  const alertedIds = await getLiveAlertedIds();

  const markLiveAlerted = async (id: string) => {
    alertedIds.push(id);
    await saveLiveAlertedIds(alertedIds);
  };

  const allPoints = [
    ...getAllRiverPoints(river),
    ...(session.localPoints ?? []),
  ];

  for (const point of allPoints) {
    if (alertedIds.includes(point.id)) continue;

    const proximityFeet = distanceFeet(location, point);

    if (proximityFeet < NAV_ALERTS.pointApproachFeet) {
      await sendNavigationNotification(
        `Approaching ${point.name}`,
        point.description || "You are approaching a river point."
      );

      await markLiveAlerted(point.id);
    }
  }
});

export const startBackgroundLiveNavigation = async (
  session: ActiveBackgroundLiveNavigation
) => {
  const safeSession: ActiveBackgroundLiveNavigation = {
    riverId: session.riverId,
    localPoints: session.localPoints ?? [],
  };

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") return false;

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== "granted") return false;

  await AsyncStorage.setItem(
    ACTIVE_LIVE_NAV_KEY,
    JSON.stringify(safeSession)
  );

  await AsyncStorage.removeItem(LIVE_ALERTED_POINTS_KEY);

  const alreadyStarted =
    await Location.hasStartedLocationUpdatesAsync(LIVE_TASK_NAME);

  if (!alreadyStarted) {
    await Location.startLocationUpdatesAsync(LIVE_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 10,
      timeInterval: 5000,
      foregroundService: {
        notificationTitle: "YakQuest Live Navigation Active",
        notificationBody: "YakQuest is watching for river points.",
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });
  }

  return true;
};

export const stopBackgroundLiveNavigation = async () => {
  try {
    const started =
      await Location.hasStartedLocationUpdatesAsync(LIVE_TASK_NAME);

    if (started) {
      await Location.stopLocationUpdatesAsync(LIVE_TASK_NAME);
    }
  } catch (error) {
    console.log("Ignoring live background stop error:", error);
  }

  await AsyncStorage.removeItem(ACTIVE_LIVE_NAV_KEY);
  await AsyncStorage.removeItem(LIVE_ALERTED_POINTS_KEY);
};

export const getBackgroundCompletedTrip = async () => {
  const raw = await AsyncStorage.getItem(BACKGROUND_COMPLETED_TRIP_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const clearBackgroundCompletedTrip = async () => {
  await AsyncStorage.removeItem(BACKGROUND_COMPLETED_TRIP_KEY);
};

export const startBackgroundNavigation = async (
  session: StartBackgroundNavigationInput
) => {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") return false;

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== "granted") return false;

  const activeSession: ActiveBackgroundNavigation = {
    ...session,
    startedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    ACTIVE_NAV_KEY,
    JSON.stringify(activeSession)
  );  

  await AsyncStorage.removeItem(ALERTED_POINTS_KEY);

  const alreadyStarted =
    await Location.hasStartedLocationUpdatesAsync(TASK_NAME);

  if (!alreadyStarted) {
    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 10,
      timeInterval: 5000,
      foregroundService: {
        notificationTitle: "YakQuest Navigation Active",
        notificationBody: "YakQuest is tracking your trip.",
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });
  }

  return true;
};

export const stopBackgroundNavigation = async () => {
  try {
    const started =
      await Location.hasStartedLocationUpdatesAsync(TASK_NAME);

    if (started) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }
  } catch (error) {
    console.log("Ignoring planned background stop error:", error);
  }

  await AsyncStorage.removeItem(ACTIVE_NAV_KEY);
  await AsyncStorage.removeItem(ALERTED_POINTS_KEY);
};