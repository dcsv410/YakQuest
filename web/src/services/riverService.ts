import { riversApi } from "@yakquest/shared";
import { apiClient } from "./apiClient";

export const fetchRivers = () => riversApi.list(apiClient);