import { db } from "@/FirebaseConfig";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ViewComments() {
  const [estaciones, setEstaciones] = useState<{ id: string; nombre: string }[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [comments, setComments] = useState<{ usuario: string; texto: string; hora: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Obtener estaciones de Firebase
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "estaciones"));
        const stationList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.id, // 🔥 Usa el ID del documento como nombre de estación
        }));
        setEstaciones(stationList);
      } catch (error) {
        console.error("Error al obtener estaciones:", error);
      }
    };
    fetchStations();
  }, []);

  // Obtener comentarios de la estación seleccionada
  const fetchComments = async (stationId: string) => {
    try {
      const stationRef = doc(db, "estaciones", stationId);
      const docSnap = await getDoc(stationRef); // 🔥 Obtener el documento de la estación
      
      if (docSnap.exists()) {
        const commentsList = docSnap.data().comentarios || []; // 🔥 Obtener el array de comentarios
        setComments(commentsList.slice(-10)); // 🔥 Mostrar solo los últimos 10 comentarios
      } else {
        setComments([]);
        Alert.alert("Sin comentarios", "Esta estación no tiene comentarios registrados.");
      }
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      Alert.alert("Error", "No se pudieron cargar los comentarios.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ver Comentarios</Text>

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
              fetchComments(item.id);
            }}>
              <Text style={styles.stationText}>{item.nombre}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Lista de comentarios */}
      {comments.length > 0 ? (
        <FlatList
          data={comments}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.comment}>
              <Text style={styles.commentText}>{item.texto}</Text>
              <Text style={styles.commentUser}>👤 {item.usuario}</Text>
              <Text style={styles.commentTime}>⏰ {item.hora}</Text>
            </View>
          )}
        />
      ) : selectedStation && <Text style={styles.noComments}>No hay comentarios disponibles.</Text>}
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
  comment: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  commentText: { fontSize: 16 },
  commentUser: { fontSize: 14, fontWeight: "bold", marginTop: 5 },
  commentTime: { fontSize: 12, color: "gray", marginTop: 2 },
  noComments: { textAlign: "center", fontSize: 16, marginTop: 20 },
});

