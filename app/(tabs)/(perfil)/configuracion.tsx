import { auth, db } from "@/FirebaseConfig";
import { router } from "expo-router";
import { updatePassword, updateProfile } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const isValidPassword = (password: string) => {
  const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
  return regex.test(password);
};

export default function ConfiguracionScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setLoading] = useState(false);

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
    let a = false;
    setLoading(true);

    if (username !== user.displayName) {
      if (username.length < 3) {
        Alert.alert("Error", "El usuario debe tener 3 o más caracteres");
        setLoading(false);
        return;
      }
      try {
        await updateProfile(user, { displayName: username }).then(async () => {
          const usersCollection = collection(db, "users");
          const q = query(usersCollection, where("uid", "==", user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0].ref;

            await updateDoc(userDoc, {
              username: username,
            });
          } else {
            console.log("No se encontró ningún usuario con ese email.");
          }
        });

        a = true;
      } catch (error: any) {
        console.log(error);
      }
    }

    if (newPassword.length !== 0) {
      if (isValidPassword(newPassword)) {
        try {
          await updatePassword(user, newPassword);
          a = true;
        } catch (error: any) {
          console.log(error);
        }
      } else {
        Alert.alert(
          "Error",
          "La contraseña debe tener al menos 6 caracteres, 1 mayúscula y 1 número"
        );
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    a === false
      ? Alert.alert("Sin cambios", "Ningún cambio realizado", [
          {
            text: "OK",
            onPress: () => router.replace("./perfil"),
          },
        ])
      : Alert.alert("Exito", "Cambios realizados", [
          {
            text: "OK",
            onPress: () => router.replace("./perfil"),
          },
        ]);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#e68059" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <Text style={styles.label}>Nombre de usuario</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Nombre de usuario (mayor a 3 caracteres)"
        placeholderTextColor="#A9A9A9"
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
        placeholder="6 caracteres y al menos 1 mayúscula y 1 número"
        placeholderTextColor="#A9A9A9"
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    color: "black",
  },
  button: {
    marginTop: 30,
    backgroundColor: "#e68059",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
