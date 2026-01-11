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
      {/* Header Mejorado */}
      <View style={styles.header}>
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Feather name="shield" size={36} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Emergencias</Text>
          <Text style={styles.headerSubtitle}>Ayuda rápida cuando más la necesitas</Text>
        </View>
      </View>

      {/* Números de Emergencia Mejorados */}
      <View style={styles.emergencySection}>
        <View style={styles.sectionHeader}>
          <Feather name="phone-call" size={20} color="#DC2626" />
          <Text style={styles.sectionTitle}>Líneas de Emergencia</Text>
        </View>
        <View style={styles.emergencyGrid}>
          {NUMEROS_EMERGENCIA.map((item) => (
            <Pressable
              key={item.telefono}
              style={styles.emergencyCard}
              onPress={() => llamarContacto(item.telefono)}
            >
              <View style={styles.emergencyIconBg}>
                <Feather name="phone" size={24} color="#fff" />
              </View>
              <Text style={styles.emergencyCardName}>{item.nombre}</Text>
              <Text style={styles.emergencyCardPhone}>{item.telefono}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Contactos Personales Mejorados */}
      <View style={styles.contactsSection}>
        <View style={styles.sectionHeader}>
          <Feather name="users" size={20} color="#059669" />
          <Text style={styles.sectionTitle}>Contactos de Confianza</Text>
        </View>
        {contactos.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Feather name="user-plus" size={40} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Sin contactos</Text>
            <Text style={styles.emptyText}>Agrega personas de confianza para emergencias</Text>
          </View>
        ) : (
          <FlatList
            data={contactos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.contactCard}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactInitial}>
                    {item.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.nombre}</Text>
                  <Text style={styles.contactPhone}>{item.telefono}</Text>
                </View>
                <View style={styles.contactActions}>
                  <Pressable 
                    style={styles.actionBtn}
                    onPress={() => llamarContacto(item.telefono)}
                  >
                    <Feather name="phone" size={18} color="#fff" />
                  </Pressable>
                  <Pressable 
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => eliminarContacto(item.id)}
                  >
                    <Feather name="trash-2" size={18} color="#fff" />
                  </Pressable>
                </View>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Feather name="user-plus" size={24} color="#059669" />
              <Text style={styles.modalTitle}>Nuevo Contacto</Text>
            </View>
            <View style={styles.inputContainer}>
              <Feather name="user" size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                placeholder="Nombre del contacto"
                placeholderTextColor="#9CA3AF"
                value={nombre}
                onChangeText={setNombre}
                style={styles.input}
              />
            </View>
            <View style={styles.inputContainer}>
              <Feather name="phone" size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                placeholder="Número telefónico"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={telefono}
                onChangeText={setTelefono}
                style={styles.input}
              />
            </View>
            <View style={styles.formButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.saveButton}
                onPress={() => {
                  agregarContacto();
                  setModalVisible(false);
                }}
              >
                <Feather name="check" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Feather name="user-plus" size={26} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },

  /* Header Mejorado */
  header: {
    backgroundColor: "#DC2626",
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
    overflow: "hidden",
    position: "relative",
  },
  decorativeCircle1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    top: -60,
    right: -40,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    bottom: -20,
    left: -30,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 1,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    textAlign: "center",
  },

  /* Secciones */
  emergencySection: {
    padding: 20,
    paddingTop: 25,
  },
  contactsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  /* Grid de Emergencias */
  emergencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  emergencyCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  emergencyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyCardName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 6,
  },
  emergencyCardPhone: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DC2626",
  },

  /* Tarjetas de Contacto */
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactInitial: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  contactActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteBtn: {
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
  },

  /* Estado Vacío */
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },

  /* Modal Mejorado */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "700",
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#059669",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#059669",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
