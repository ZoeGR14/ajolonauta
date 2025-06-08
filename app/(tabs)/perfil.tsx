import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function MyAccountScreen() {
  return (
    <View style={styles.container}>

      {/* Imagen de perfil grande y centrada */}
      <View style={styles.profileWrapper}>
        <Image
          source={{ uri: "https://i.pinimg.com/736x/54/34/81/5434817e23dca00394b77ca6b38dc895.jpg" }}
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.editButton}>
          <Feather name="edit" size={20} color="#e68059" />
        </TouchableOpacity>
        <Text style={styles.name}>Kang Seul-Gi</Text>
        <Text style={styles.number}>55-4545-4545</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Option icon="phone" label="Teléfono" />
        <Option icon="heart" label="Líneas guardadas" />
        <Option icon="settings" label="Modificar datos" />
        <Option icon="help-circle" label="FAQs" />

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const Option = ({ icon, label }: { icon: string; label: string }) => (
  <TouchableOpacity style={styles.option}>
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
  profileWrapper: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 70,
  },
  editButton: {
    marginTop: 10,
    backgroundColor: "#fff3e0",
    padding: 8,
    borderRadius: 20,
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
});
