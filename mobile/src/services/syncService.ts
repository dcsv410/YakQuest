import { syncSavedTripsAfterLogin } from "./savedTripService";
import { syncCompletedTripsAfterLogin } from "./completedTripService";

export async function syncUserData() {
  await syncSavedTripsAfterLogin();
  await syncCompletedTripsAfterLogin();
}