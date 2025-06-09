import { Poppins_400Regular, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback } from "react";
import { StatusBar, Text, View } from "react-native";

SplashScreen.preventAutoHideAsync();

StatusBar.setBackgroundColor("#E68059", true);

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
    style: { fontFamily: "Poppins_400Regular" },
  };
}


  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, paddingTop: StatusBar.currentHeight }} onLayout={onLayoutRootView}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
