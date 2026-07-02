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
    quality: 0.45,
    base64: true,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];

  if (!asset?.base64) return null;

  const mimeType = asset.mimeType ?? "image/jpeg";

  return `data:${mimeType};base64,${asset.base64}`;
}