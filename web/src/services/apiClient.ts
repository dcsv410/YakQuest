import { ApiClient } from "@yakquest/shared";
import { API_URL } from "../config";
import { getToken } from "./authService";

export const apiClient = new ApiClient({
  baseUrl: API_URL,
  tokenProvider: getToken,
});