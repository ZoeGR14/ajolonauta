import {
  Poppins_400Regular,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import { Platform, StatusBar as RNStatusBar, Text, View } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (fontsLoaded && !(Text as any).defaultProps) {
    (Text as any).defaultProps = {
      style: { fontFamily: "Poppins_600Regular" },
    };
  }

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {/* Simula el fondo del status bar */}
      <View
        style={{
          height: Platform.OS === "android" ? RNStatusBar.currentHeight : 44,
          backgroundColor: "#e68059",
        }}
      />
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </View>
  );
}
