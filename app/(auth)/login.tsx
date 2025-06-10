import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../FirebaseConfig';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/avisos'); // Redirige a "avisos" si el login es exitoso
    } catch (error) {
      Alert.alert('Error', 'Credenciales incorrectas o problema de conexión');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' }}>
      {/* Título */}
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' }}>
        Iniciar Sesión
      </Text>

      {/* Campo Email */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 8, fontWeight: '500' }}>Email</Text>
        <TextInput
          placeholder="Ingresa tu email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            paddingHorizontal: 12,
          }}
        />
      </View>

      {/* Campo Contraseña con botón de mostrar/ocultar */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ marginBottom: 8, fontWeight: '500' }}>Contraseña</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}>
          <TextInput
            placeholder="Ingresa tu contraseña"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={{ flex: 1, height: 50, paddingHorizontal: 12 }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
            <Text>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón Login con Firebase */}
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 20,
        }}
        onPress={handleLogin}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Login</Text>
      </TouchableOpacity>

      {/* Enlace a Recuperar Contraseña */}
      <View style={{ alignItems: 'center', marginBottom: 15 }}>
        <TouchableOpacity onPress={() => router.push('/forgot-pass')}>
          <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>

      {/* Enlace a SignUp */}
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ marginRight: 5 }}>¿Aún no tienes cuenta?</Text>
        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


