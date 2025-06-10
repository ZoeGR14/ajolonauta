import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo - igual que en las otras pantallas */}
      <View style={styles.logoContainer}>
        <Text style={styles.appName}></Text>
      </View>

      {/* Botón de Inicio de Sesión */}
      <TouchableOpacity style={styles.button} onPress={() => router.push("/login")}>
        <Text style={styles.buttonText}>Inicio de Sesión</Text>
      </TouchableOpacity>

      {/* Botón de Registro */}
      <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={() => router.push("/signup")}>
        <Text style={[styles.buttonText, styles.outlineButtonText]}>Registro de Usuario</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  outlineButtonText: {
    color: "#007AFF",
  },
});
