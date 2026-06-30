import AsyncStorage from "@react-native-async-storage/async-storage";
import { RiverPoint } from "../../src/data/types";
import {
  createSavedTripInApi,
  fetchSavedTripsFromApi,
  deleteSavedTripFromApi,
} from "./apiSavedTripService";

import { getAllRivers } from "./riverService";

const AUTH_TOKEN_KEY = "yakquest:authToken";

const SAVED_TRIPS_KEY = "yakquest:savedTrips";

export type SavedTrip = {
  id: string;
  riverId: string;
  riverName: string;
  state: string;

  start: RiverPoint;
  end: RiverPoint;

  distanceMiles: number;
  createdAt: string;
  updatedAt?: string;

  notes?: string;

  backendId?: string;
  syncedAt?: string;
  syncStatus?: "local-only" | "synced" | "failed";
};

const isUserLoggedIn = async () => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return !!token;
};

const resolveBackendRiverId = async (trip: SavedTrip): Promise<string | null> => {
  const rivers = await getAllRivers();

  const match = rivers.find(
    (river) =>
      river.id === trip.riverId ||
      river.name === trip.riverName
  );

  return match?.id ?? null;
};

const toApiSavedTripPayload = async (trip: SavedTrip) => {
  const backendRiverId = await resolveBackendRiverId(trip);

  if (!backendRiverId) {
    throw new Error(`Could not resolve backend river ID for ${trip.riverName}`);
  }

  return {
    riverId: backendRiverId,
    name: trip.riverName,

    startName: trip.start.name,
    startLatitude: trip.start.latitude,
    startLongitude: trip.start.longitude,

    endName: trip.end.name,
    endLatitude: trip.end.latitude,
    endLongitude: trip.end.longitude,

    plannedDistanceMiles: trip.distanceMiles,
    estimatedTimeMin: null,

    notes: trip.notes ?? null,
  };
};

const fromApiSavedTrip = (apiTrip: any): SavedTrip => ({
  id: apiTrip.id,
  backendId: apiTrip.id,

  riverId: apiTrip.river_id,
  riverName: apiTrip.name ?? "Saved Trip",
  state: "",

  start: {
    id: `${apiTrip.id}-start`,
    name: apiTrip.start_name ?? "Start",
    type: "public_access",
    latitude: apiTrip.start_latitude,
    longitude: apiTrip.start_longitude,
  },

  end: {
    id: `${apiTrip.id}-end`,
    name: apiTrip.end_name ?? "End",
    type: "public_access",
    latitude: apiTrip.end_latitude,
    longitude: apiTrip.end_longitude,
  },

  distanceMiles: apiTrip.planned_distance_miles ?? 0,

  notes: apiTrip.notes ?? undefined,

  createdAt: apiTrip.created_at,
  updatedAt: apiTrip.updated_at,

  syncStatus: "synced",
  syncedAt: new Date().toISOString(),
});

export const getSavedTrips = async (): Promise<SavedTrip[]> => {
  const raw = await AsyncStorage.getItem(SAVED_TRIPS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveTripLocally = async (trip: SavedTrip) => {
  const trips = await getSavedTrips();

  const existingIndex = trips.findIndex((item) => item.id === trip.id);

  const updatedTrip = {
    ...trip,
    updatedAt: new Date().toISOString(),
  };

  const updatedTrips =
    existingIndex >= 0
      ? trips.map((item) => (item.id === trip.id ? updatedTrip : item))
      : [updatedTrip, ...trips];

  await AsyncStorage.setItem(SAVED_TRIPS_KEY, JSON.stringify(updatedTrips));
};

export const saveTrip = async (trip: SavedTrip): Promise<SavedTrip> => {
  const loggedIn = await isUserLoggedIn();

  if (!loggedIn) {
    const localTrip = {
      ...trip,
      syncStatus: "local-only" as const,
    };

    await saveTripLocally(localTrip);
    return localTrip;
  }

  try {
    const apiTrip = await createSavedTripInApi(await toApiSavedTripPayload(trip));
    const syncedTrip = fromApiSavedTrip(apiTrip);

    await saveTripLocally(syncedTrip);

    return syncedTrip;
  } catch (error) {
    console.error("Failed to save trip to backend", error);

    const fallbackTrip = {
      ...trip,
      syncStatus: "failed" as const,
    };

    await saveTripLocally(fallbackTrip);
    return fallbackTrip;
  }
};

export const syncSavedTripsAfterLogin = async () => {
  const loggedIn = await isUserLoggedIn();

  if (!loggedIn) {
    return;
  }

  const localTrips = await getSavedTrips();

  const unsyncedLocalTrips = localTrips.filter(
    (trip) => !trip.backendId
  );

  const uploadedTrips: SavedTrip[] = [];

  for (const trip of unsyncedLocalTrips) {
    try {
      const apiTrip = await createSavedTripInApi(await toApiSavedTripPayload(trip));
      uploadedTrips.push(fromApiSavedTrip(apiTrip));
    } catch (error) {
      console.error("Failed to upload local trip during sync", error);
      uploadedTrips.push({
        ...trip,
        syncStatus: "failed",
      });
    }
  }

  const backendTripsRaw = await fetchSavedTripsFromApi();
  const backendTrips = backendTripsRaw.map(fromApiSavedTrip);

  const mergedByBackendId = new Map<string, SavedTrip>();

  for (const trip of backendTrips) {
    if (trip.backendId) {
      mergedByBackendId.set(trip.backendId, trip);
    }
  }

  for (const trip of uploadedTrips) {
    if (trip.backendId) {
      mergedByBackendId.set(trip.backendId, trip);
    }
  }

  const failedLocalTrips = uploadedTrips.filter(
    (trip) => !trip.backendId
  );

  const mergedTrips = [
    ...Array.from(mergedByBackendId.values()),
    ...failedLocalTrips,
  ];

  await AsyncStorage.setItem(
    SAVED_TRIPS_KEY,
    JSON.stringify(mergedTrips)
  );

  return mergedTrips;
};

export const getSavedTripById = async (
  tripId: string
): Promise<SavedTrip | undefined> => {
  const trips = await getSavedTrips();
  return trips.find((trip) => trip.id === tripId);
};

export const deleteSavedTrip = async (tripId: string) => {
  const trips = await getSavedTrips();
  const trip = trips.find((item) => item.id === tripId);

  if (trip?.backendId && await isUserLoggedIn()) {
    await deleteSavedTripFromApi(trip.backendId);
  }

  const filtered = trips.filter((item) => item.id !== tripId);

  await AsyncStorage.setItem(
    SAVED_TRIPS_KEY,
    JSON.stringify(filtered)
  );
};

export const getSavedTripCount = async (): Promise<number> => {
  const trips = await getSavedTrips();
  return trips.length;
};

export const clearSavedTrips = async () => {
  await AsyncStorage.removeItem(SAVED_TRIPS_KEY);
};