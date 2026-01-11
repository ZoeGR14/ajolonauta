export default {
   expo: {
      name: "AjoloNauta",
      slug: "app_movil",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "appmovil",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      ios: {
         supportsTablet: true,
      },
      android: {
         edgeToEdgeEnabled: true,
         package: "com.zoegr.app_movil",
         config: {
            googleMaps: {
               apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
         },
         permissions: ["RECEIVE_BOOT_COMPLETED", "VIBRATE", "NOTIFICATIONS"],
      },
      web: {
         bundler: "metro",
         output: "static",
         favicon: "./assets/images/favicon.png",
      },
      plugins: [
         "expo-router",
         [
            "expo-splash-screen",
            {
               image: "./assets/images/splash-icon.png",
               imageWidth: 200,
               resizeMode: "contain",
               backgroundColor: "#ffffff",
            },
         ],
         "expo-font",
         "expo-web-browser",
         [
            "expo-notifications",
            {
               icon: "./assets/images/notification-icon.png",
               color: "#e68059",
            },
         ],
      ],
      experiments: {
         typedRoutes: true,
      },
      extra: {
         router: {},
         eas: {
            projectId: "327e210d-776c-4591-89e8-538b2839329b",
         },
         EXPO_PUBLIC_GOOGLE_MAPS_API_KEY:
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
         EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
         EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:
            process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
         EXPO_PUBLIC_FIREBASE_PROJECT_ID:
            process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
         EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:
            process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
         EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
            process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
         EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      },
   },
};
