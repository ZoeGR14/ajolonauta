
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../FirebaseConfig';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/avisos'); // Redirige a "avisos" si el login es exitoso
    } catch (error) {
      Alert.alert('Error', 'Credenciales incorrectas o problema de conexión');
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
          marginBottom: 25,
          textAlign: "center",
        }}
      >
        Iniciar Sesión
      </Text>

      {/* Campos del formulario */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 8, fontWeight: '500' }}>Usuario (Email)</Text>
        <TextInput
          placeholder="Ingresa tu email"
          value={email}
          onChangeText={setEmail}
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            paddingHorizontal: 12,
          }}
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ marginBottom: 8, fontWeight: "500" }}>Contraseña</Text>
        <TextInput
          placeholder="Ingresa tu contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            paddingHorizontal: 12,
          }}
        />
      </View>

      {/* Botón Login con Firebase */}
      <TouchableOpacity
        style={{
          backgroundColor: "#007AFF",
          padding: 15,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 20,
        }}
        onPress={handleLogin} // Llama a la función de autenticación
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Login</Text>
      </TouchableOpacity>

      {/* Enlace a Login si ya tiene cuenta */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Link
          href="./forgot-pass"
          style={{ color: "#007AFF", fontWeight: "bold" }}
        >
          Olvidé mi contraseña
        </Link>
      </View>
    </View>
  );
}

