import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: "Inicio de Sesión" }} />
      <Stack.Screen name="signup" options={{ title: "Regístrate" }} />
      <Stack.Screen name="forgot-pass" options={{ title: "Olvide mi contraseña" , headerShown: true, headerBackTitle: "Atrás"  }}
      />
    </Stack>
  );
}
