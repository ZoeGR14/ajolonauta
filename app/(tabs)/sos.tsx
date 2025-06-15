import { auth, db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
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
  { nombre: "DENUNCIA ANÓNIMA", telefono: "089" }
];

export default function SOS() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const user = auth.currentUser;

  // Obtener contactos de Firebase
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "contactos_sos"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const contactosData: Contacto[] = [];
      querySnapshot.forEach((doc) => {
        contactosData.push({
          id: doc.id,
          nombre: doc.data().nombre,
          telefono: doc.data().telefono,
          userId: doc.data().userId
        });
      });
      setContactos(contactosData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const agregarContacto = async () => {
    if (!nombre || !telefono) {
      Alert.alert("Error", "Debes ingresar nombre y número");
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
        userId: user.uid
      });
      setNombre("");
      setTelefono("");
      setShowForm(false);
    } catch (error) {
      console.error("Error al agregar contacto:", error);
      Alert.alert("Error", "No se pudo agregar el contacto");
    }
  };

  const eliminarContacto = async (id: string) => {
    try {
      await deleteDoc(doc(db, "contactos_sos", id));
    } catch (error) {
      console.error("Error al eliminar contacto:", error);
      Alert.alert("Error", "No se pudo eliminar el contacto");
    }
  };

  const llamarContacto = (numero: string) => {
    Linking.openURL(`tel:${numero}`);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e68059" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Números de emergencia predeterminados */}
      <Text style={styles.sectionTitle}>Números de emergencia</Text>
      {NUMEROS_EMERGENCIA.map((item) => (
        <Pressable
          key={item.telefono}
          style={styles.emergencyContact}
          onPress={() => llamarContacto(item.telefono)}
        >
          <Text style={styles.emergencyContactName}>{item.nombre}</Text>
          <Text style={styles.emergencyContactNumber}>{item.telefono}</Text>
        </Pressable>
      ))}

      {/* Lista de contactos personales */}
      <Text style={styles.sectionTitle}>Tus contactos de emergencia</Text>
      
      {contactos.length === 0 ? (
        <Text style={styles.emptyText}>No hay contactos guardados</Text>
      ) : (
        <FlatList
          data={contactos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.contactoItem}>
              <View style={styles.contactoInfo}>
                <Text style={styles.contactoNombre}>{item.nombre}</Text>
                <Text style={styles.contactoTelefono}>{item.telefono}</Text>
              </View>
              <View style={styles.contactoActions}>
                <Pressable 
                  style={styles.callButton} 
                  onPress={() => llamarContacto(item.telefono)}
                >
                  <Feather name="phone-call" size={20} color="white" />
                </Pressable>
                <Pressable 
                  style={styles.deleteButton} 
                  onPress={() => eliminarContacto(item.id)}
                >
                  <Feather name="trash" size={20} color="white" />
                </Pressable>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Formulario para agregar contactos (solo visible cuando showForm es true) */}
      {showForm && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del contacto"
            value={nombre}
            onChangeText={setNombre}
          />
          <TextInput
            style={styles.input}
            placeholder="Número telefónico"
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
          />
          <View style={styles.formButtons}>
            <Pressable style={styles.cancelButton} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.addButton} onPress={agregarContacto}>
              <Text style={styles.addButtonText}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Botón flotante para mostrar el formulario */}
      <Pressable 
        style={styles.floatingButton}
        onPress={() => setShowForm(true)}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 15,
  },
  emergencyContact: {
    backgroundColor: "#ffebee",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  emergencyContactName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  emergencyContactNumber: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  contactoItem: {
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  contactoInfo: {
    flex: 1,
  },
  contactoNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  contactoTelefono: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  contactoActions: {
    flexDirection: "row",
    gap: 10,
  },
  callButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 20,
  },
  deleteButton: {
    backgroundColor: "#ff4444",
    padding: 10,
    borderRadius: 20,
  },
  separator: {
    height: 10,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  addButton: {
    backgroundColor: "#e68059",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#e68059",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});