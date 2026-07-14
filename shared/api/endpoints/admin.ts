import type { ApiClient } from "../../network";
import type {
  AdminAnalyticsDTO,
  AdminDashboardStatsDTO,
  AdminUserDTO,
  AdminUserUpdateDTO,
} from "../../dto";

export const adminApi = {
  dashboard(
    client: ApiClient
  ): Promise<AdminDashboardStatsDTO> {
    return client.get<AdminDashboardStatsDTO>(
      "/admin/dashboard"
    );
  },

  users(
    client: ApiClient
  ): Promise<AdminUserDTO[]> {
    return client.get<AdminUserDTO[]>(
      "/admin/users"
    );
  },

  updateUser(
    client: ApiClient,
    userId: string,
    updates: AdminUserUpdateDTO
  ): Promise<AdminUserDTO> {
    return client.patch<
      AdminUserDTO,
      AdminUserUpdateDTO
    >(`/admin/users/${userId}`, updates);
  },

  analytics(
    client: ApiClient
  ): Promise<AdminAnalyticsDTO> {
    return client.get<AdminAnalyticsDTO>(
      "/admin/analytics"
    );
  },
};