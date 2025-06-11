import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../../FirebaseConfig";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Correo Enviado",
        "Revisa tu bandeja de entrada para restablecer tu contraseña"
      );
      router.push("/login"); // Redirige al login tras enviar el correo
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo enviar el correo. Verifica la dirección ingresada."
      );
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#fff",
      }}
    >
      {/* Título */}
      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          marginBottom: 30,
          textAlign: "center",
        }}
      >
        Recuperar Contraseña
      </Text>

      {/* Instrucciones */}
      <Text style={{ marginBottom: 25, textAlign: "center", color: "#666" }}>
        Ingresa tu correo electrónico para recibir instrucciones de
        recuperación.
      </Text>

      {/* Campo Email */}
      <View style={{ marginBottom: 25 }}>
        <Text style={{ marginBottom: 8, fontWeight: "500" }}>
          Correo Electrónico
        </Text>
        <TextInput
          placeholder="Ingresa tu correo"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            paddingHorizontal: 12,
          }}
        />
      </View>

      {/* Botón Enviar Instrucciones */}
      <TouchableOpacity
        style={{
          backgroundColor: "#e68059",
          padding: 15,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 20,
        }}
        onPress={handlePasswordReset}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>
          Enviar Instrucciones
        </Text>
      </TouchableOpacity>

      {/* Enlace para volver al Login */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={{ color: "#007AFF", fontWeight: "bold" }}>
            Volver al Inicio de Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
