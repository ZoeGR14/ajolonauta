import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Linking,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";

export default function SOS() {
  const contactos = [
    { nombre: "Papá", telefono: "5555555555" },
    { nombre: "Mamá", telefono: "4444444444" },
  ];
  const emergencia = [
    { nombre: "Emergencias", telefono: "911" },
  ];

  const llamar = (telefono: string) => {
    Linking.openURL(`tel:${telefono}`).catch(() =>
      Alert.alert("Error", "No se pudo realizar la llamada")
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CONTACTOS DE EMERGENCIA</Text>

      {/* Emergencia primero, con estilo distinto */}
      {emergencia.map((item) => (
        <View key={item.telefono} style={styles.contactoEmergencia}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Pressable
            style={styles.btnLlamar}
            onPress={() => llamar(item.telefono)}
          >
            <Feather name="phone-call" size={15} color="#bf5f3a" />
          </Pressable>
        </View>
      ))}

      <FlatList
        data={contactos}
        keyExtractor={(item) => item.telefono}
        renderItem={({ item }) => (
          <View style={styles.contacto}>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Pressable
              style={styles.btnLlamar}
              onPress={() => llamar(item.telefono)}
            >
              <Feather name="phone-call" size={15} color="#bf5f3a" />
            </Pressable>
          </View>
        )}
      />

      <Pressable
        style={styles.btnNuevo}
        onPress={() =>
          Alert.alert("Esto debería redireccionar a los contactos xd")
        }
      >
        <Text style={styles.btnTexto}>+ Añadir contacto</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    alignSelf: "center",
  },
  contacto: {
    backgroundColor: "#e6815a21",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactoEmergencia: {
    backgroundColor: "#8f1300a3", // color especial
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nombre: {
    fontSize: 16,
    fontWeight: "600",
  },
  btnLlamar: {
    backgroundColor: "#e6815a21",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 25,
  },
  btnNuevo: {
    marginTop: 30,
    backgroundColor: "#c2613c",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnTexto: {
    color: "white",
    fontWeight: "bold",
  },
});
