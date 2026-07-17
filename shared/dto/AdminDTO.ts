export type AdminDashboardStatsDTO = {
  rivers: number;
  pendingContributions: number;
  users: number;
  completedTrips: number;
};

export type AdminUserDTO = {
  id: string;
  email: string;
  displayName?: string | null;
  isAdmin: boolean;
  trustScore: number;
  approvedContributions: number;
  rejectedContributions: number;
  approvalRate?: number | null;
};

export type AdminUserUpdateDTO = {
  isAdmin?: boolean;
  trustScore?: number;
};

export type AdminCompletedTripSummaryDTO = {
  tripsCompleted: number;
  actualMiles: number;
  plannedMiles: number;
  elapsedTimeSeconds: number;
  riversExplored: number;
};

export type AdminAnalyticsDTO = {
  rivers: number;
  users: number;
  uniqueContributors: number;
  pendingContributions: number;
  approvedContributions: number;
  rejectedContributions: number;
  completedTrips: number;
  savedTrips: number;
  completedTripSummary: AdminCompletedTripSummaryDTO;
};