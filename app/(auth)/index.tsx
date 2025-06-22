import { router } from "expo-router";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  return (
    <ImageBackground
      source={{
        uri: "https://images.pexels.com/photos/18399463/pexels-photo-18399463.jpeg",
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logoCircle}
            />
          </View>
          <Text style={styles.appName}>AjoloNauta</Text>
          <Text style={styles.subtitle}>Tu guía inteligente en la ciudad</Text>
        </View>

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // capa oscura sobre la imagen
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  logoCircle: {
    backgroundColor: "#fff",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  logoText: {
    fontSize: 36,
    color: "#e68059",
    fontWeight: "bold",
  },
  appName: {
    fontSize: 30,
    fontFamily: "Poppins_400Regular",
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#ddd",
    marginTop: 5,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#e68059",
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: "#fff",
    borderWidth: 1.5,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
