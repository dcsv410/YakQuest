import {
  adminApi,
  type AdminAnalyticsFiltersDTO,
  type AdminUserUpdateDTO,
} from "@yakquest/shared";

import { apiClient } from "./apiClient";

export const fetchAdminDashboard = () =>
  adminApi.dashboard(apiClient);

export const fetchAdminUsers = () =>
  adminApi.users(apiClient);

export const updateAdminUser = (
  userId: string,
  updates: AdminUserUpdateDTO
) =>
  adminApi.updateUser(
    apiClient,
    userId,
    updates
  );

export const fetchAdminAnalytics = () =>
  adminApi.analytics(apiClient);

export const fetchFilteredAdminAnalytics = (
  filters: AdminAnalyticsFiltersDTO
) =>
  adminApi.filteredAnalytics(
    apiClient,
    filters
  );