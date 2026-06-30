import type { ApiClient } from "../../network";
import type {
  AdminAnalyticsDTO,
  AdminDashboardStatsDTO,
  AdminUserDTO,
} from "../../dto";

export const adminApi = {
  dashboard(client: ApiClient): Promise<AdminDashboardStatsDTO> {
    return client.get<AdminDashboardStatsDTO>("/admin/dashboard");
  },

  users(client: ApiClient): Promise<AdminUserDTO[]> {
    return client.get<AdminUserDTO[]>("/admin/users");
  },

  analytics(client: ApiClient): Promise<AdminAnalyticsDTO> {
    return client.get<AdminAnalyticsDTO>("/admin/analytics");
  },
};