
import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../FirebaseConfig';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Registro Exitoso', 'Cuenta creada correctamente');
      router.push('/login'); // Redirige a login después de registrarse
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la cuenta, verifica los datos');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' }}>
        Regístrate
      </Text>

      {/* Campo Email */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5, fontWeight: '500' }}>Correo Electrónico</Text>
        <TextInput
          placeholder="Ingresa tu email"
          value={email}
          onChangeText={setEmail}
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 10,
          }}
        />
      </View>

      {/* Campo Contraseña */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5, fontWeight: "500" }}>Contraseña</Text>
        <TextInput
          placeholder="Crea tu contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 10,
          }}
        />
      </View>
      {/* Botón Sign Up con Firebase */}
      <TouchableOpacity
        style={{
          backgroundColor: "#e68059",
          padding: 15,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 20,
        }}
        onPress={handleSignUp} // Llama a la función de registro
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Sign Up</Text>
      </TouchableOpacity>

      {/* Enlace a Login si ya tiene cuenta */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Text style={{ marginRight: 5 }}>¿Ya tienes cuenta?</Text>
        <Link href="./login" style={{ color: "#e68059", fontWeight: "bold" }}>
          Iniciar Sesión
        </Link>
      </View>
    </View>
  );
}
