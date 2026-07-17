import {
  contributionsApi,
  type CreateContributionRequestDTO,
} from "@yakquest/shared";
import { apiClient } from "./apiClient";

export const submitContribution = (
  payload: CreateContributionRequestDTO
) => contributionsApi.submit(apiClient, payload);

export const fetchAdminContributions = () =>
  contributionsApi.listAdmin(apiClient);

export const approveContribution = (id: string) =>
  contributionsApi.approve(apiClient, id);

export const rejectContribution = (id: string) =>
  contributionsApi.reject(apiClient, id);

export const applyContribution = (id: string) =>
  contributionsApi.apply(apiClient, id);