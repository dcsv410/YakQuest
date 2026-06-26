import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_RIVERS_KEY = "yakquest:recentRivers";
const MAX_RECENT_RIVERS = 8;

export const getRecentRiverIds = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(RECENT_RIVERS_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const addRecentRiverId = async (
  riverId: string
): Promise<string[]> => {
  const current = await getRecentRiverIds();

  const updated = [
    riverId,
    ...current.filter((id) => id !== riverId),
  ].slice(0, MAX_RECENT_RIVERS);

  await AsyncStorage.setItem(
    RECENT_RIVERS_KEY,
    JSON.stringify(updated)
  );

  return updated;
};

export const clearRecentRivers = async () => {
  await AsyncStorage.removeItem(RECENT_RIVERS_KEY);
};