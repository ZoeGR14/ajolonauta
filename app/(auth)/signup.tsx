import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../FirebaseConfig"; // Asegúrate de importar Firestore

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // Nuevo campo
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validar que el nombre de usuario no esté registrado
  const checkUsernameExists = async (username: unknown) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Devuelve true si ya existe
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    // Validar si el nombre de usuario ya está registrado
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      Alert.alert("Error", "El nombre de usuario ya está en uso.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Guardar datos en Firestore
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        username: username,
        email: email,
      });

      Alert.alert("Registro Exitoso", "Cuenta creada correctamente");
      router.replace("/(tabs)"); // Redirige a la pantalla principal
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la cuenta, verifica los datos");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 30, textAlign: "center" }}>
        Regístrate
      </Text>

      {/* Campo Nombre de Usuario */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5, fontWeight: "500" }}>Nombre de Usuario</Text>
        <TextInput
          placeholder="Crea tu nombre de usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={{ height: 50, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 }}
        />
      </View>

      {/* Campo Email */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5, fontWeight: "500" }}>Correo Electrónico</Text>
        <TextInput
          placeholder="Ingresa tu email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ height: 50, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 }}
        />
      </View>

      {/* Campo Contraseña con botón de mostrar/ocultar */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5, fontWeight: "500" }}>Contraseña</Text>
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

      {/* Campo Confirmar Contraseña */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5, fontWeight: "500" }}>Confirmar Contraseña</Text>
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

      {/* Botón Sign Up */}
      <TouchableOpacity style={{ backgroundColor: "#e68059", padding: 15, borderRadius: 8, alignItems: "center", marginBottom: 20 }} onPress={handleSignUp}>
        <Text style={{ color: "white", fontWeight: "bold" }}>Sign Up</Text>
      </TouchableOpacity>

      {/* Enlace a Login */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Text style={{ marginRight: 5 }}>¿Ya tienes cuenta?</Text>
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={{ color: "#007AFF", fontWeight: "bold" }}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
