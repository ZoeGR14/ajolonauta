import { Stack } from "expo-router";

export default function IndexLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="leerAvisos" />
      <Stack.Screen name="crearAviso" />
      <Stack.Screen name="avisoTwitter" />
    </Stack>
  );
}