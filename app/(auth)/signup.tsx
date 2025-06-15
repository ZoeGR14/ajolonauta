import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../../FirebaseConfig";

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      if (user) {
        router.replace("/(tabs)"); // Redirige a "avisos" si el
        Alert.alert("Registro Exitoso", "Cuenta creada correctamente"); // login es exitoso
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la cuenta, verifica los datos");
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
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 30,
          textAlign: "center",
        }}
      >
        Regístrate
      </Text>

      {/* Campo Email */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5, fontWeight: "500" }}>
          Correo Electrónico
        </Text>
        <TextInput
          placeholder="Ingresa tu email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 10,
          }}
        />
      </View>

      {/* Campo Contraseña con botón de mostrar/ocultar */}
      <View style={{ marginBottom: 15, position: "relative" }}>
        <Text style={{ marginBottom: 5, fontWeight: "500" }}>Contraseña</Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
          }}
        >
          <TextInput
            placeholder="Crea tu contraseña"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={{ flex: 1, height: 50, padding: 10 }}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={{ padding: 10 }}
          >
            <Text>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Campo Confirmar Contraseña con botón de mostrar/ocultar */}
      <View style={{ marginBottom: 15, position: "relative" }}>
        <Text style={{ marginBottom: 5, fontWeight: "500" }}>
          Confirmar Contraseña
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
          }}
        >
          <TextInput
            placeholder="Repite tu contraseña"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={{ flex: 1, height: 50, padding: 10 }}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{ padding: 10 }}
          >
            <Text>{showConfirmPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón Sign Up */}
      <TouchableOpacity
        style={{
          backgroundColor: "#e68059",
          padding: 15,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 20,
        }}
        onPress={handleSignUp}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Sign Up</Text>
      </TouchableOpacity>

      {/* Enlace a Login */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Text style={{ marginRight: 5 }}>¿Ya tienes cuenta?</Text>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={{ color: "#007AFF", fontWeight: "bold" }}>
            Iniciar Sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
