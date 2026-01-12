import { initializeNotifications } from "@/services/notifications";
import {
   Poppins_400Regular,
   Poppins_700Bold,
   useFonts,
} from "@expo-google-fonts/poppins";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, StatusBar as RNStatusBar, View } from "react-native";

// Mantiene el splash screen visible mientras cargamos recursos
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
   const [fontsLoaded, error] = useFonts({
      Poppins_400Regular,
      Poppins_700Bold,
   });

   // Inicializar notificaciones push
   useEffect(() => {
      const cleanup = initializeNotifications();
      return () => {
         cleanup.then((fn) => fn && fn());
      };
   }, []);
   // Manejo de errores y ocultamiento del Splash Screen
   useEffect(() => {
      if (error) throw error;

      if (fontsLoaded) {
         SplashScreen.hideAsync();
      }
   }, [fontsLoaded, error]);

   // Si las fuentes no han cargado y no hay error, no renderizamos nada aún
   if (!fontsLoaded && !error) {
      return null;
   }

   return (
      <View style={{ flex: 1 }}>
         {/* StatusBar sin translucent para evitar que el contenido se dibuje debajo */}
         <StatusBar style="light" backgroundColor="#DC2626" />
         <View
            style={{
               height:
                  Platform.OS === "android"
                     ? RNStatusBar.currentHeight || 0
                     : 44,
               backgroundColor: "#DC2626",
            }}
         />
         <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
         </Stack>
      </View>
   );
}
