import { auth, db } from "@/FirebaseConfig";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const checkUsernameExists = async (username: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      Alert.alert("Error", "El nombre de usuario ya está en uso.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Guardar en Firebase Auth
      await updateProfile(user, { displayName: username });

      // Guardar también en Firestore (opcional si usas más datos)
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        username,
        email,
      });

      Alert.alert("Registro Exitoso", "Cuenta creada correctamente");
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la cuenta. Verifica los datos.");
      console.error(error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 30, textAlign: "center" }}>
        Regístrate
      </Text>

      {/* Nombre de usuario */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5 }}>Nombre de Usuario</Text>
        <TextInput
          placeholder="Crea tu nombre de usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={{ height: 50, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 }}
        />
      </View>

      {/* Email */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5 }}>Correo Electrónico</Text>
        <TextInput
          placeholder="Ingresa tu email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ height: 50, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 }}
        />
      </View>

      {/* Contraseña */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5 }}>Contraseña</Text>
        <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8 }}>
          <TextInput
            placeholder="Crea tu contraseña"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={{ flex: 1, height: 50, padding: 10 }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
            <Text>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirmar contraseña */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5 }}>Confirmar Contraseña</Text>
        <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8 }}>
          <TextInput
            placeholder="Repite tu contraseña"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={{ flex: 1, height: 50, padding: 10 }}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 10 }}>
            <Text>{showConfirmPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón */}
      <TouchableOpacity
        style={{ backgroundColor: "#e68059", padding: 15, borderRadius: 8, alignItems: "center", marginBottom: 20 }}
        onPress={handleSignUp}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Sign Up</Text>
      </TouchableOpacity>

      {/* Ir a login */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Text style={{ marginRight: 5 }}>¿Ya tienes cuenta?</Text>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={{ color: "#d14e1b", fontWeight: "bold" }}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
