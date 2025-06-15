import { auth, db } from "@/FirebaseConfig";
import { arrayUnion, collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AddComment() {
  const [estaciones, setEstaciones] = useState<{ id: string; nombre: string }[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Obtener estaciones de la subcolección en Firebase
  useEffect(() => {
    const fetchStations = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "estaciones"));
    
    const stationList = querySnapshot.docs.map(doc => ({
      id: doc.id,  // 🔥 Usa el ID del documento como nombre de estación
      nombre: doc.id, // 🔥 Almacena el nombre de la estación desde el ID
    }));

    setEstaciones(stationList);
  } catch (error) {
    console.error("Error al obtener estaciones:", error);
  }
};

    fetchStations();
  }, []);

  // Guardar comentario en Firebase
  const handleSubmit = async () => {
    if (!selectedStation) {
      Alert.alert("Error", "Selecciona una estación antes de continuar.");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Error", "El comentario no puede estar vacío.");
      return;
    }
    if (comment.length > 200) {
      Alert.alert("Error", "El comentario no puede superar los 200 caracteres.");
      return;
    }

    try {
      const stationRef = doc(db, "estaciones", selectedStation);
      await updateDoc(stationRef, {
        comentarios: arrayUnion({
          usuario: auth.currentUser?.email || "Anónimo",
          texto: comment,
          hora: new Date().toLocaleString(),
        }),
      });

      Alert.alert("Comentario agregado", "Tu comentario se ha guardado correctamente.");
      setComment(""); // Limpia el campo de texto después de enviar
      setSelectedStation(null); // Restablece la selección
    } catch (error) {
      console.error("Error al guardar comentario:", error);
      Alert.alert("Error", "No se pudo guardar el comentario.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Añadir Comentario</Text>

      {/* Selector de estaciones */}
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDropdown(!showDropdown)}>
        <Text style={styles.dropdownText}>
          {selectedStation ? estaciones.find(est => est.id === selectedStation)?.nombre : "Selecciona una estación"}
        </Text>
      </TouchableOpacity>

      {showDropdown && (
        <FlatList
          data={estaciones}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.stationItem} onPress={() => {
              setSelectedStation(item.id);
              setShowDropdown(false);
            }}>
              <Text style={styles.stationText}>{item.nombre}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Campo de comentario */}
      <TextInput
        style={styles.input}
        placeholder="Escribe tu comentario (máx. 200 caracteres)"
        value={comment}
        onChangeText={setComment}
        maxLength={200}
      />

      {/* Botón de envío */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Enviar Comentario</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  dropdownButton: {
    backgroundColor: "#f1f1f1",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  dropdownText: { fontSize: 16, fontWeight: "bold" },
  stationItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  stationText: { fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  button: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
