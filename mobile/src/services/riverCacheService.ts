import AsyncStorage from "@react-native-async-storage/async-storage";
import type { River } from "@yakquest/shared";

const RIVER_CACHE_KEY = "yakquest:riverCache";
const RIVER_CACHE_UPDATED_AT_KEY = "yakquest:riverCacheUpdatedAt";

export async function saveRiversToCache(rivers: River[]) {
  await AsyncStorage.setItem(RIVER_CACHE_KEY, JSON.stringify(rivers));
  await AsyncStorage.setItem(
    RIVER_CACHE_UPDATED_AT_KEY,
    new Date().toISOString()
  );
}

export async function getCachedRivers(): Promise<River[]> {
  const raw = await AsyncStorage.getItem(RIVER_CACHE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getRiverCacheUpdatedAt(): Promise<string | null> {
  return AsyncStorage.getItem(RIVER_CACHE_UPDATED_AT_KEY);
}

export async function clearRiverCache() {
  await AsyncStorage.removeItem(RIVER_CACHE_KEY);
  await AsyncStorage.removeItem(RIVER_CACHE_UPDATED_AT_KEY);
}