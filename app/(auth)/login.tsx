import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../FirebaseConfig"; // Asegúrate de importar Firestore

export default function LoginScreen() {
  const router = useRouter();
  const [loginInput, setLoginInput] = useState(""); // Puede ser email o username
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const getEmailFromUsername = async (username: unknown) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().email; // Obtiene el email del usuario registrado
    }
    return null; // No encontrado
  };

  const handleLogin = async () => {
    try {
      let email = loginInput;
      
      // Si no ingresó un email, buscar el email en Firebase
      if (!email.includes("@")) {
        email = await getEmailFromUsername(loginInput);
        if (!email) {
          Alert.alert("Error", "Nombre de usuario no encontrado.");
          return;
        }
      }

      const user = await signInWithEmailAndPassword(auth, email, password);
      if (user) router.replace("/(tabs)"); // Redirige a la pantalla principal
    } catch (error) {
      Alert.alert("Error", "Credenciales incorrectas o problema de conexión.");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" }}>
      {/* Título */}
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 25, textAlign: "center" }}>
        Iniciar Sesión
      </Text>

      {/* Campo de Login (Email o Nombre de Usuario) */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 8, fontWeight: "500" }}>Correo o Nombre de Usuario</Text>
        <TextInput
          placeholder="Ingresa tu email o nombre de usuario"
          value={loginInput}
          onChangeText={setLoginInput}
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

      {/* Campo Contraseña con botón de mostrar/ocultar */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ marginBottom: 8, fontWeight: "500" }}>Contraseña</Text>
        <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8 }}>
          <TextInput
            placeholder="Ingresa tu contraseña"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={{ flex: 1, height: 50, paddingHorizontal: 12 }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
            <Text>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón Login con Firebase */}
      <TouchableOpacity style={{ backgroundColor: "#e68059", padding: 15, borderRadius: 8, alignItems: "center", marginBottom: 20 }} onPress={handleLogin}>
        <Text style={{ color: "white", fontWeight: "bold" }}>Login</Text>
      </TouchableOpacity>

      {/* Enlace a Recuperar Contraseña */}
      <View style={{ alignItems: "center", marginBottom: 15 }}>
        <TouchableOpacity onPress={() => router.push("/forgot-pass")}>
          <Text style={{ color: "#007AFF", fontWeight: "bold" }}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>

      {/* Enlace a SignUp */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Text style={{ marginRight: 5 }}>¿Aún no tienes cuenta?</Text>
        <TouchableOpacity onPress={() => router.push("/signup")}>
          <Text style={{ color: "#007AFF", fontWeight: "bold" }}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
