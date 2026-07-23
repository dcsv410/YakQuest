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
      [
        "expo-camera",
        {
          cameraPermission:
            "Allow YakQuest to use the camera to scan another paddler's trip QR code.",
        },
      ],
    ],

    android: {
      package: "com.yakquest.mobile",
      versionCode: 1,

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
        "android.permission.CAMERA",
      ],

      config: {
        googleMaps: {
          apiKey:
            process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },

    androidNavigationBar: {
      backgroundColor: "#00000000",
      barStyle: "light-content",
    },

    extra: {
      apiUrl:
        "https://api.yakquest.com",
      eas: {
        projectId:
          "0ca4db72-c8e9-4b89-8b24-163903fc7e9d",
      },
    },
  },
};