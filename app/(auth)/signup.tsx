import { auth, db } from "@/FirebaseConfig";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
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
  const [loading, setLoading] = useState(false); // 🟠 loader

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
      setLoading(true); // 🔄 activa el loader

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: username });

      await addDoc(collection(db, "users"), {
        uid: user.uid,
        username,
        email,
      });

      Alert.alert("Registro Exitoso", "Cuenta creada correctamente");
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo crear la cuenta. Verifique los campos."
      );
      console.log(error);
    } finally {
      setLoading(false); // 🔽 desactiva el loader
    }
  };

  return (
    <>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.container2}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Crear Cuenta</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de Usuario</Text>
              <TextInput
                placeholder="Crea tu nombre de usuario"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                style={styles.input}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                placeholder="Ingresa tu correo"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Crea una contraseña"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  style={styles.inputPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eye}
                  disabled={loading}
                >
                  <Text>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Repite la contraseña"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.inputPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eye}
                  disabled={loading}
                >
                  <Text>{showConfirmPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.contra}>La contraseña debe contener al menos 6 caracteres y al menos 1 mayúscula y 1 número</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Registrarme</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={{ color: "#555" }}>¿Ya tienes cuenta?</Text>
              <TouchableOpacity
                onPress={() => router.push("/login")}
                disabled={loading}
              >
                <Text style={styles.link}> Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Loader modal */}
        <Modal transparent animationType="fade" visible={loading}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loaderText}>Registrando cuenta...</Text>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#fefefe",
  },
  container2: {
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
  contra:{
    color: "#bab7b6",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 10,
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
    color: "black",
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
  footer: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "center",
  },
  link: {
    color: "#d14e1b",
    fontWeight: "bold",
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 10,
    color: "#fff",
    fontWeight: "bold",
  },
});
