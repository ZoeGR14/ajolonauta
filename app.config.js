import fs from "fs";
import path from "path";

// Función para cargar el archivo env
function loadEnv() {
  const envPath = path.join(__dirname, "env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const envVars = {};
    envContent.split("\n").forEach((line) => {
      if (line && !line.startsWith("#") && line.includes("=")) {
        const [key, ...valueParts] = line.split("=");
        envVars[key.trim()] = valueParts.join("=").trim();
      }
    });
    return envVars;
  }
  return {};
}

const env = loadEnv();

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
      edgeToEdgeEnabled: false,
      package: "com.zoegr.app_movil",
      config: {
        googleMaps: {
          apiKey: env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      googleServicesFile: "./google-services.json",
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
      "expo-notifications",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "327e210d-776c-4591-89e8-538b2839329b",
      },
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      EXPO_PUBLIC_FIREBASE_API_KEY: env.EXPO_PUBLIC_FIREBASE_API_KEY,
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:
        env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
        env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      EXPO_PUBLIC_FIREBASE_APP_ID: env.EXPO_PUBLIC_FIREBASE_APP_ID,
    },
  },
};
