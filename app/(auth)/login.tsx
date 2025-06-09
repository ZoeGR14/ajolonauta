import { useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter(); 

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' }}>
      {/* Título */}
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' }}>
        Iniciar Sesión
      </Text>

      {/* Campos del formulario */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 8, fontWeight: '500' }}>Usuario</Text>
        <TextInput
          placeholder="Ingresa tu usuario"
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            paddingHorizontal: 12,
          }}
        />
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ marginBottom: 8, fontWeight: '500' }}>Contraseña</Text>
        <TextInput
          placeholder="Ingresa tu contraseña"
          secureTextEntry
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            paddingHorizontal: 12,
          }}
        />
      </View>

      {/* Botón Login con navegación */}
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 20,
        }}
        onPress={() => router.push('/avisos')} 
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}
