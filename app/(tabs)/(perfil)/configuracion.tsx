import { auth } from "@/FirebaseConfig";
import { updatePassword, updateProfile } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ConfiguracionScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUsername(user.displayName || "");
      setEmail(user.email || "");
    }
  }, []);

  const handleUpdate = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "No hay usuario autenticado.");
      return;
    }

    try {
      if (username !== user.displayName) {
        await updateProfile(user, { displayName: username });
      }

      if (newPassword && newPassword.length >= 6) {
        await updatePassword(user, newPassword);
      }

      Alert.alert("Éxito", "Los datos han sido actualizados.");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "No se pudieron actualizar los datos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <Text style={styles.label}>Nombre de usuario</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Nombre de usuario"
      />

      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput
        style={[styles.input, { backgroundColor: "#eee" }]}
        value={email}
        editable={false}
      />

      <Text style={styles.label}>Nueva contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Deja vacío si no deseas cambiarla"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  button: {
    marginTop: 30,
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
