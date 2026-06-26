import { useCallback, useEffect, useState } from "react";
import {
  getSavedTrips,
  saveTrip,
  deleteSavedTrip,
  SavedTrip,
} from "../../../../src/services/savedTripService";
import { River, RiverPoint } from "../../../data/types";

export function useSavedTrips() {
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  const loadSavedTrips = useCallback(async () => {
    const trips = await getSavedTrips();
    setSavedTrips(trips);
  }, []);

  useEffect(() => {
    loadSavedTrips();
  }, [loadSavedTrips]);

  const saveCurrentTrip = async (
    river: River,
    start: RiverPoint,
    end: RiverPoint,
    distanceMiles: number
  ) => {
    const now = new Date().toISOString();

    const saved = await saveTrip({
      id: `saved-trip-${Date.now()}`,
      riverId: river.id,
      riverName: river.name,
      state: river.state,
      start,
      end,
      distanceMiles,
      createdAt: now,
      updatedAt: now,
    });

    setSavedTrips((current) => [saved, ...current]);

    return saved;
  };

  const removeSavedTrip = async (tripId: string) => {
    await deleteSavedTrip(tripId);
    setSavedTrips((current) =>
      current.filter((trip) => trip.id !== tripId)
    );
  };

  return {
    savedTrips,
    loadSavedTrips,
    saveCurrentTrip,
    removeSavedTrip,
  };
}