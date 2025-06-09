import { Link } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ForgotPasswordScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' }}>
      {/* Título */}
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' }}>
        Recuperar Contraseña
      </Text>

      {/* Instrucciones */}
      <Text style={{ marginBottom: 25, textAlign: 'center', color: '#666' }}>
        Ingresa tu correo electrónico o número de teléfono para recibir instrucciones de recuperación
      </Text>

      {/* Campo Email/Teléfono */}
      <View style={{ marginBottom: 25 }}>
        <Text style={{ marginBottom: 8, fontWeight: '500' }}>Correo o Teléfono</Text>
        <TextInput
          placeholder="Ingresa tu correo o número telefónico"
          keyboardType="email-address"
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            paddingHorizontal: 12,
          }}
        />
      </View>

      {/* Botón Enviar Instrucciones */}
      <TouchableOpacity
        style={{
          backgroundColor: '#e68059',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Enviar Instrucciones</Text>
      </TouchableOpacity>

      {/* Enlace para volver al Login */}
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Link href="/login" style={{ color: '#e68059', fontWeight: 'bold' }}>
          Volver al Inicio de Sesión
        </Link>
      </View>
    </View>
  );
}