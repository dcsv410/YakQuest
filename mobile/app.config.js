require("dotenv").config();

module.exports = {
  expo: {
    name: "YakQuest",
    slug: "yakquest",
    scheme: "yakquest",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./images/icon.png",
    splash: {
      image: "./images/icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow YakQuest to access your location while navigating rivers.",
          locationAlwaysPermission:
            "Allow YakQuest to access your location in the background while a trip is active.",
          locationWhenInUsePermission:
            "Allow YakQuest to access your location while using the app.",
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
    ],
    android: {
      package: "com.yakquest.mobile",
      adaptiveIcon: {
        foregroundImage: "./images/icon.png",
        backgroundColor: "#EAF7F7",
      },
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
    },
  },
};