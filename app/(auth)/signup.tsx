import { Link } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignUpScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' }}>
      {/* Título */}
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' }}>
        Regístrate
      </Text>

      {/* Campo Usuario */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5, fontWeight: '500' }}>Usuario</Text>
        <TextInput
          placeholder="Crea tu nombre de usuario"
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
          }}
        />
      </View>

      {/* Campo Contraseña */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 5, fontWeight: '500' }}>Contraseña</Text>
        <TextInput
          placeholder="Crea tu contraseña"
          secureTextEntry
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
          }}
        />
      </View>

      {/* Campo Teléfono */}
      <View style={{ marginBottom: 25 }}>
        <Text style={{ marginBottom: 5, fontWeight: '500' }}>Teléfono</Text>
        <TextInput
          placeholder="Ingresa tu número telefónico"
          keyboardType="phone-pad"
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
          }}
        />
      </View>

      {/* Botón Sign In */}
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Sign In</Text>
      </TouchableOpacity>

      {/* Enlace a Login si ya tiene cuenta */}
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ marginRight: 5 }}>¿Ya tienes cuenta?</Text>
        <Link href="/login" style={{ color: '#007AFF', fontWeight: 'bold' }}>
          Iniciar Sesión
        </Link>
      </View>
    </View>
  );
}