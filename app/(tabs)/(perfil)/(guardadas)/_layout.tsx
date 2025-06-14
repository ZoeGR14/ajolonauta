import { Stack } from "expo-router";

export default function PerfilLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="rutasGuardadas" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
