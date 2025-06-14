import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MyAccountScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.profileWrapper}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: "https://i.pinimg.com/736x/54/34/81/5434817e23dca00394b77ca6b38dc895.jpg",
            }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editButton}>
            <Feather name="edit" size={20} color="#e68059" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>Kang Seul-Gi</Text>
        <Text style={styles.number}>55-4545-4545</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Option icon="phone" label="Teléfono" />
        <Option
          icon="heart"
          label="Líneas guardadas"
          onPress={() => router.push("./rutasGuardadas")}
        />
        <Option icon="settings" label="Modificar datos" />
        <Option icon="help-circle" label="FAQs" />

        <TouchableOpacity style={styles.logoutButton}>
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
  number: {
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
    bottom: 3, // 🔧 distancia desde la parte inferior del círculo
    right: 15, // 🔧 distancia desde el borde derecho del círculo
    backgroundColor: "white",
    borderRadius: 20,
    padding: 6,
    elevation: 3, // sombra en Android
    shadowColor: "#000", // sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
