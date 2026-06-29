import { contributionsApi } from "@yakquest/shared";
import { apiClient } from "./apiClient";

export const fetchAdminContributions = () =>
  contributionsApi.listAdmin(apiClient);

export const approveContribution = (id: string) =>
  contributionsApi.approve(apiClient, id);

export const rejectContribution = (id: string) =>
  contributionsApi.reject(apiClient, id);

export const applyContribution = (id: string) =>
  contributionsApi.apply(apiClient, id);