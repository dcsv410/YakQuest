export type SavedTrip = {
  id: string;

  riverId: string;
  riverName?: string | null;
  name?: string | null;

  startName: string;
  startLatitude: number;
  startLongitude: number;

  endName: string;
  endLatitude: number;
  endLongitude: number;

  plannedDistanceMiles: number;
  estimatedTimeMin?: number | null;

  notes?: string | null;

  createdAt: string;
  updatedAt?: string | null;
};