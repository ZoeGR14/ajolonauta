import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import {
  Alert,
  BackHandler,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SOS() {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "¿Salir de la app?",
          "¿Estás segura/o de que quieres salir?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Salir", onPress: () => BackHandler.exitApp() },
          ]
        );
        return true; // Previene el comportamiento por defecto
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );
  const contactos = [
    { nombre: "Papá", telefono: "5555555555" },
    { nombre: "Mamá", telefono: "4444444444" },
  ];
  const emergencia = [{ nombre: "E M E R G E N C I A S", telefono: "911" }];

  const llamar = (telefono: string) => {
    Linking.openURL(`tel:${telefono}`).catch(() =>
      Alert.alert("Error", "No se pudo realizar la llamada")
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CONTACTOS DE EMERGENCIA</Text>

      {emergencia.map((item) => (
        <View key={item.telefono} style={styles.contactoEmergencia}>
          <Text style={[styles.nombre, styles.textoE]}>{item.nombre}</Text>
          <Pressable
            style={styles.btnLlamarE}
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

      {/* Botón flotante en la esquina inferior derecha */}
      <Pressable
        style={styles.botonFlotante}
        onPress={() =>
          Alert.alert("Esto debería redireccionar a los contactos xd")
        }
      >
        <Feather name="plus" size={24} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
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
    backgroundColor: "#8f1300a3",
    color: "white",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textoE: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
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
  btnLlamarE: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 25,
  },
  botonFlotante: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#c2613c",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5, // sombra en Android
    shadowColor: "#000", // sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
