import { auth } from "@/FirebaseConfig"; // Usa la instancia configurada correctamente
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MyAccountScreen() {
  const [image, setImage] = useState(
    "https://i.pinimg.com/736x/54/34/81/5434817e23dca00394b77ca6b38dc895.jpg"
  );
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUsername(user.displayName || "Error al cargar el nombre.");
      setEmail(user.email || "Error al cargar el correo.");
    }
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permiso requerido", "Se necesita acceso a tu galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/"); // Redirige a la pantalla inicial (login o welcome)
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar la sesión.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert("¿Salir de la app?", "¿Estás segura/o de que quieres salir?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileWrapper}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.profileImage} />
          <TouchableOpacity style={styles.editButton} onPress={pickImage}>
            <Feather name="edit" size={20} color="#e68059" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{username}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Option icon="phone" label="Teléfono" />
        <Option
          icon="heart"
          label="Líneas guardadas"
          onPress={() => router.push("./rutasGuardadas")}
        />
        <Option
          icon="settings"
          label="Modificar datos"
          onPress={() => router.push("./configuracion")}
        />
        <Option icon="help-circle" label="FAQs" />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const Option = ({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.option} onPress={onPress}>
    <View style={styles.optionLeft}>
      <Feather name={icon as any} size={24} color="#e68059" />
      <Text style={styles.optionText}>{label}</Text>
    </View>
    <Feather name="chevron-right" size={20} color="#ccc" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  email: {
    fontSize: 14,
    color: "gray",
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fffbf6",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    marginLeft: 15,
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 30,
    padding: 15,
    borderColor: "red",
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "red",
    fontWeight: "bold",
    fontSize: 16,
  },
  profileWrapper: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  imageContainer: {
    position: "relative",
    width: 160,
    height: 160,
  },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  editButton: {
    position: "absolute",
    bottom: 3,
    right: 15,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
