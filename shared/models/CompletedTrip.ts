export type CompletedTripParticipant = {
  userId: string;
  displayName: string;
  role: "navigator" | "participant";
};

export type CompletedTrip = {
  id: string;
  riverId: string;
  riverName: string;
  state?: string | null;
  startName?: string | null;
  endName?: string | null;
  plannedDistanceMiles?: number | null;
  actualDistanceMiles?: number | null;
  elapsedTimeSeconds?: number | null;
  startedAt?: string | null;
  completedAt: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;

  participants: CompletedTripParticipant[];

  currentUserRole:
    | "navigator"
    | "participant";
};