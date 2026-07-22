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
  homeState: string;
  isAdmin: boolean;
  trustScore: number;
  approvedContributions: number;
  rejectedContributions: number;
  approvalRate?: number | null;
};

export type AdminUserUpdateDTO = {
  homeState?: string;
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

export type AdminCompletedTripRowDTO = {
  id: string;
  completedAt: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  userHomeState: string;
  riverId: string;
  riverName: string;
  riverState?: string | null;
  startName?: string | null;
  endName?: string | null;
  plannedMiles: number;
  actualMiles: number;
  elapsedTimeSeconds: number;
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
  completedTripSummary:
    AdminCompletedTripSummaryDTO;
  completedTripRows:
    AdminCompletedTripRowDTO[];
};

export type AdminAnalyticsFiltersDTO = {
  homeState?: string;
  startDate: string;
  endDate: string;
};

export type AdminFilteredAnalyticsDTO = {
  filters: {
    homeState?: string | null;
    startDate: string;
    endDate: string;
  };

  users: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    contributingUsers: number;
  };

  trips: {
    savedTrips: number;
    completedTrips: number;
    plannedMiles: number;
    actualMiles: number;
    elapsedTimeSeconds: number;
    riversExplored: number;
  };

  contributions: {
    submitted: number;
    pending: number;
    approved: number;
    rejected: number;
    approvalRate?: number | null;
  };

  completedTripRows:
    AdminCompletedTripRowDTO[];
};