// app/(tabs)/(perfil)/configuracion.tsx
import { getAuth, updatePassword, updateProfile } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ConfiguracionScreen() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.displayName || "");
    }
  }, [user]);

  const handleUpdate = async () => {
    try {
      if (user) {
        // 🔁 Cambiar nombre de usuario
        if (username && username !== user.displayName) {
          await updateProfile(user, { displayName: username });
        }

        // 🔁 Cambiar contraseña si se ingresó
        if (password.length >= 6) {
          await updatePassword(user, password);
        }

        Alert.alert("Actualizado", "Los cambios se guardaron correctamente.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Ocurrió un error al actualizar los datos.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <Text style={styles.label}>Nombre de usuario</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={username}
        onChangeText={setUsername}
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
        placeholder="Mínimo 6 caracteres"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
