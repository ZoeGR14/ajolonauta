import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../FirebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const [loginInput, setLoginInput] = useState(""); // email o username
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const getEmailFromUsername = async (username: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().email;
    }
    return null;
  };

  const handleLogin = async () => {
    try {
      let email = loginInput;
      if (!email.includes("@")) {
        email = await getEmailFromUsername(loginInput);
        if (!email) {
          Alert.alert("Error", "Nombre de usuario no encontrado.");
          return;
        }
      }

      const user = await signInWithEmailAndPassword(auth, email, password);
      if (user) router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Credenciales incorrectas o problema de conexión.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Iniciar Sesión</Text>

        {/* Email o Usuario */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo o Nombre de Usuario</Text>
          <TextInput
            placeholder="Ingresa tu correo o usuario"
            value={loginInput}
            onChangeText={setLoginInput}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        {/* Contraseña */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Ingresa tu contraseña"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.inputPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eye}
            >
              <Text>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón de login */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Ingresar</Text>
        </TouchableOpacity>

        {/* Enlace a recuperación */}
        <TouchableOpacity onPress={() => router.push("/forgot-pass")} style={styles.linkContainer}>
          <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {/* Enlace a registro */}
        <View style={styles.footer}>
          <Text style={{ color: "#555" }}>¿Aún no tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.link}> Regístrate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fefefe",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 25,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#e68059",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 5,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 15,
    backgroundColor: "#f9f9f9",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  inputPassword: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
  },
  eye: {
    padding: 10,
  },
  button: {
    backgroundColor: "#e68059",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  linkContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  linkText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 5,
  },
  link: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});
