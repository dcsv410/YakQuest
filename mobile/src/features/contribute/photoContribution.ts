import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export async function pickContributionPhoto(): Promise<string | null> {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Permission Required",
      "YakQuest needs access to your photo library to upload pictures."
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0]?.uri ?? null;
}