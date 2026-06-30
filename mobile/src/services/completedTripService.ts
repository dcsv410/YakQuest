import AsyncStorage from "@react-native-async-storage/async-storage";
import { RiverPoint } from "../data/types";
import { getAllRivers } from "./riverService";
import {
  createCompletedTripInApi,
  deleteCompletedTripFromApi,
  fetchCompletedTripsFromApi,
  updateCompletedTripInApi,
} from "./apiCompletedTripService";

const COMPLETED_TRIPS_KEY = "yakquest:completedTrips";
const AUTH_TOKEN_KEY = "yakquest:authToken";

export type CompletedTrip = {
  id: string;
  riverId: string;
  riverName: string;
  state: string;
  start: RiverPoint;
  end: RiverPoint;
  plannedDistanceMiles: number;
  actualDistanceMiles: number;
  elapsedMs: number;
  notes: string;
  completedAt: string;

  backendId?: string;
  syncedAt?: string;
  syncStatus?: "local-only" | "synced" | "failed";
};

const isUserLoggedIn = async () => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return !!token;
};

const saveCompletedTripLocally = async (trip: CompletedTrip) => {
  const trips = await getCompletedTrips();

  const existingIndex = trips.findIndex((item) => item.id === trip.id);

  const updatedTrips =
    existingIndex >= 0
      ? trips.map((item) => (item.id === trip.id ? trip : item))
      : [trip, ...trips];

  await AsyncStorage.setItem(
    COMPLETED_TRIPS_KEY,
    JSON.stringify(updatedTrips)
  );
};

const resolveBackendRiverId = async (
  trip: Pick<CompletedTrip, "riverId" | "riverName">
): Promise<string | null> => {
  const rivers = await getAllRivers();

  const match = rivers.find(
    (river) => river.id === trip.riverId || river.name === trip.riverName
  );

  return match?.id ?? null;
};

const toApiCompletedTripPayload = async (trip: CompletedTrip) => {
  const backendRiverId = await resolveBackendRiverId(trip);

  if (!backendRiverId) {
    throw new Error(`Could not resolve backend river ID for ${trip.riverName}`);
  }

  return {
    riverId: backendRiverId,
    riverName: trip.riverName,
    state: trip.state,

    startName: trip.start.name,
    endName: trip.end.name,

    plannedDistanceMiles: trip.plannedDistanceMiles,
    actualDistanceMiles: trip.actualDistanceMiles,

    elapsedTimeSeconds: Math.round(trip.elapsedMs / 1000),

    startedAt: null,
    completedAt: trip.completedAt,

    notes: trip.notes ?? null,
  };
};

const fromApiCompletedTrip = (apiTrip: any): CompletedTrip => ({
  id: apiTrip.id,
  backendId: apiTrip.id,

  riverId: apiTrip.river_id,
  riverName: apiTrip.river_name,
  state: apiTrip.state ?? "",

  start: {
    id: `${apiTrip.id}-start`,
    name: apiTrip.start_name ?? "Start",
    type: "public_access",
    latitude: 0,
    longitude: 0,
  },

  end: {
    id: `${apiTrip.id}-end`,
    name: apiTrip.end_name ?? "End",
    type: "public_access",
    latitude: 0,
    longitude: 0,
  },

  plannedDistanceMiles: apiTrip.planned_distance_miles ?? 0,
  actualDistanceMiles: apiTrip.actual_distance_miles ?? 0,
  elapsedMs: (apiTrip.elapsed_time_seconds ?? 0) * 1000,
  notes: apiTrip.notes ?? "",
  completedAt: apiTrip.completed_at,

  syncStatus: "synced",
  syncedAt: new Date().toISOString(),
});

export const getCompletedTrips = async (): Promise<CompletedTrip[]> => {
  const raw = await AsyncStorage.getItem(COMPLETED_TRIPS_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const syncCompletedTripsAfterLogin = async () => {
  const loggedIn = await isUserLoggedIn();

  if (!loggedIn) {
    return;
  }

  const localTrips = await getCompletedTrips();

  const unsyncedLocalTrips = localTrips.filter((trip) => !trip.backendId);

  const uploadedTrips: CompletedTrip[] = [];

  for (const trip of unsyncedLocalTrips) {
    try {
      const apiTrip = await createCompletedTripInApi(
        await toApiCompletedTripPayload(trip)
      );

      uploadedTrips.push(fromApiCompletedTrip(apiTrip));
    } catch (error) {
      console.error("Failed to upload completed trip during sync", error);

      uploadedTrips.push({
        ...trip,
        syncStatus: "failed",
      });
    }
  }

  const backendTripsRaw = await fetchCompletedTripsFromApi();
  const backendTrips = backendTripsRaw.map(fromApiCompletedTrip);

  const mergedByBackendId = new Map<string, CompletedTrip>();

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

  const failedLocalTrips = uploadedTrips.filter((trip) => !trip.backendId);

  const mergedTrips = [
    ...Array.from(mergedByBackendId.values()),
    ...failedLocalTrips,
  ];

  await AsyncStorage.setItem(
    COMPLETED_TRIPS_KEY,
    JSON.stringify(mergedTrips)
  );

  return mergedTrips;
};

export const saveCompletedTrip = async (
  trip: Omit<
    CompletedTrip,
    "id" | "completedAt" | "backendId" | "syncedAt" | "syncStatus"
  >
): Promise<CompletedTrip> => {
  const completedTrip: CompletedTrip = {
    ...trip,
    id: `${trip.riverId}-${Date.now()}`,
    completedAt: new Date().toISOString(),
  };

  const loggedIn = await isUserLoggedIn();

  if (!loggedIn) {
    const localTrip: CompletedTrip = {
      ...completedTrip,
      syncStatus: "local-only",
    };

    await saveCompletedTripLocally(localTrip);
    return localTrip;
  }

  try {
    const apiTrip = await createCompletedTripInApi(
      await toApiCompletedTripPayload(completedTrip)
    );

    const syncedTrip = fromApiCompletedTrip(apiTrip);

    await saveCompletedTripLocally(syncedTrip);

    return syncedTrip;
  } catch (error) {
    console.error("Failed to save completed trip to backend", error);

    const fallbackTrip: CompletedTrip = {
      ...completedTrip,
      syncStatus: "failed",
    };

    await saveCompletedTripLocally(fallbackTrip);

    return fallbackTrip;
  }
};

export const deleteCompletedTrip = async (tripId: string) => {
  const trips = await getCompletedTrips();
  const trip = trips.find((item) => item.id === tripId);

  const loggedIn = await isUserLoggedIn();

  if (loggedIn && trip?.backendId) {
    await deleteCompletedTripFromApi(trip.backendId);
  }

  const filtered = trips.filter((item) => item.id !== tripId);

  await AsyncStorage.setItem(COMPLETED_TRIPS_KEY, JSON.stringify(filtered));
};

export const updateCompletedTripNotes = async (
  tripId: string,
  notes: string
) => {
  const trips = await getCompletedTrips();
  const trip = trips.find((item) => item.id === tripId);

  const loggedIn = await isUserLoggedIn();

  if (loggedIn && trip?.backendId) {
    await updateCompletedTripInApi(trip.backendId, {
      notes,
    });
  }

  const updatedTrips = trips.map((item) =>
    item.id === tripId
      ? {
          ...item,
          notes,
        }
      : item
  );

  await AsyncStorage.setItem(
    COMPLETED_TRIPS_KEY,
    JSON.stringify(updatedTrips)
  );
};

export const getCompletedTripById = async (
  id: string
): Promise<CompletedTrip | null> => {
  const trips = await getCompletedTrips();

  return trips.find((trip) => trip.id === id) ?? null;
};