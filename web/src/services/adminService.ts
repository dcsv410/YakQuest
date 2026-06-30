import { adminApi } from "@yakquest/shared";
import { apiClient } from "./apiClient";

export const fetchAdminDashboard = () =>
  adminApi.dashboard(apiClient);

export const fetchAdminUsers = () =>
  adminApi.users(apiClient);

export const fetchAdminAnalytics = () =>
  adminApi.analytics(apiClient);