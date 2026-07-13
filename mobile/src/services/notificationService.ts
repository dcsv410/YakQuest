import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const NAVIGATION_CHANNEL_ID = "yakquest-navigation";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const setupNavigationNotifications = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(
      NAVIGATION_CHANNEL_ID,
      {
        name: "YakQuest Navigation",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      }
    );
  }

  const existing = await Notifications.getPermissionsAsync();

  const permission =
    existing.status === "granted"
      ? existing
      : await Notifications.requestPermissionsAsync();

  return permission.status === "granted";
};

export const sendNavigationNotification = async (
  title: string,
  body: string
) => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
      },
      trigger: null,
    });

    console.log("Scheduled notification:", id);
    return id;
  } catch (error) {
    console.log("Notification failed:", error);
    return null;
  }
};