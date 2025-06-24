import { auth, db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Contacto = {
  id: string;
  nombre: string;
  telefono: string;
  userId: string;
};

const NUMEROS_EMERGENCIA = [
  { nombre: "EMERGENCIAS", telefono: "911" },
  { nombre: "LOCATEL", telefono: "5556581111" },
  { nombre: "PROTECCIÓN CIVIL", telefono: "5551280000" },
  { nombre: "DENUNCIA ANÓNIMA", telefono: "089" },
];

export default function SOS() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const user = auth.currentUser;

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
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "contactos_sos"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: Contacto[] = [];
      querySnapshot.forEach((doc) =>
        data.push({ id: doc.id, ...doc.data() } as Contacto)
      );
      setContactos(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const agregarContacto = async () => {
    if (!nombre || !telefono) {
      Alert.alert("Campos vacíos", "Completa nombre y número");
      return;
    }
    if (!user) {
      Alert.alert("Error", "No hay usuario autenticado");
      return;
    }

    try {
      await addDoc(collection(db, "contactos_sos"), {
        nombre,
        telefono,
        userId: user.uid,
      });
      setNombre("");
      setTelefono("");
    } catch (error) {
      Alert.alert("Error", "No se pudo agregar el contacto");
    }
  };

  const eliminarContacto = async (id: string) => {
    try {
      await deleteDoc(doc(db, "contactos_sos", id));
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar el contacto");
    }
  };

  const llamarContacto = (numero: string) => {
    Linking.openURL(`tel:${numero}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#e68059" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Números de emergencia</Text>
      <View style={styles.emergencyList}>
        {NUMEROS_EMERGENCIA.map((item, index) => (
          <Pressable
            key={item.telefono}
            style={styles.emergencyRow}
            onPress={() => llamarContacto(item.telefono)}
          >
            <View style={styles.emergencyInfo}>
              <Feather
                name="alert-triangle"
                size={18}
                color="#e68059"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.emergencyName}>{item.nombre}</Text>
            </View>
            <Text style={styles.emergencyPhone}>{item.telefono}</Text>
            {index < NUMEROS_EMERGENCIA.length - 1 && (
              <View style={styles.emergencyDivider} />
            )}
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Tus contactos</Text>
      {contactos.length === 0 ? (
        <Text style={styles.emptyText}>No hay contactos guardados</Text>
      ) : (
        <FlatList
          data={contactos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Feather name="user" size={20} color="#333" />
                <View>
                  <Text style={styles.cardText}>{item.nombre}</Text>
                  <Text style={styles.cardNumber}>{item.telefono}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable onPress={() => llamarContacto(item.telefono)}>
                  <Feather name="phone-call" size={20} color="#4CAF50" />
                </Pressable>
                <Pressable onPress={() => eliminarContacto(item.id)}>
                  <Feather name="trash-2" size={20} color="#ff4444" />
                </Pressable>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar contacto</Text>
            <TextInput
              placeholder="Nombre del contacto"
              placeholderTextColor="#A9A9A9"
              value={nombre}
              onChangeText={setNombre}
              style={styles.input}
            />
            <TextInput
              placeholder="Número telefónico"
              placeholderTextColor="#A9A9A9"
              keyboardType="phone-pad"
              value={telefono}
              onChangeText={setTelefono}
              style={styles.input}
            />
            <View style={styles.formButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "#666", fontWeight: "bold" }}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                style={styles.saveButton}
                onPress={() => {
                  agregarContacto();
                  setModalVisible(false);
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Guardar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Feather name="plus" size={24} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
    color: "#333",
  },
  emergencyList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 16,
    elevation: 2,
  },
  emergencyRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emergencyInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  emergencyName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  emergencyPhone: {
    position: "absolute",
    right: 16,
    top: 12,
    fontSize: 15,
    color: "#666",
  },
  emergencyDivider: {
    height: 1,
    backgroundColor: "#f1f1f1",
    marginTop: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  cardNumber: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 15,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#e68059",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#e68059",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 12,
    padding: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
});
