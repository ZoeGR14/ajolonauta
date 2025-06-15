import { lineas, lines } from "@/assets/data/info"; // 🔥 Importando líneas y estaciones desde info.ts
import { auth, db } from "@/FirebaseConfig";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function AddComment() {
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [showLineasDropdown, setShowLineasDropdown] = useState(false);
  const [showEstacionesDropdown, setShowEstacionesDropdown] = useState(false);

  // Obtener estaciones de la línea seleccionada
  const getStationsByLine = (lineaId: string) => {
    const linea = lines.find(l => l.linea === lineaId);
    return linea ? linea.estaciones.map(est => est.nombre) : [];
  };

  // Guardar comentario en Firebase
  const handleSubmit = async () => {
    if (!selectedLinea || !selectedStation) {
      Alert.alert("Error", "Selecciona una línea y una estación antes de continuar.");
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

    const estacionId = `${selectedStation} - ${selectedLinea.replace("Línea", "Linea")}`; // 🔥 Corrige el nombre

    try {
      const stationRef = doc(db, "estaciones", estacionId);
      await updateDoc(stationRef, {
        comentarios: arrayUnion({
          usuario: auth.currentUser?.email || "Anónimo",
          texto: comment,
          hora: new Date().toLocaleString(),
        }),
      });

      Alert.alert("Comentario agregado", "Tu comentario se ha guardado correctamente.");
      setComment("");
      setSelectedLinea(null);
      setSelectedStation(null);
    } catch (error) {
      console.error("Error al guardar comentario:", error);
      Alert.alert("Error", "No se pudo guardar el comentario.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Añadir Comentario</Text>

      {/* Selector de línea */}
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowLineasDropdown(!showLineasDropdown)}>
        <Text style={styles.dropdownText}>
          {selectedLinea || "Selecciona una línea"}
        </Text>
      </TouchableOpacity>

      {showLineasDropdown && (
        <FlatList
          data={lineas}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.lineItem} onPress={() => {
              setSelectedLinea(item);
              setShowLineasDropdown(false);
              setShowEstacionesDropdown(true);
            }}>
              <Text style={styles.lineText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Selector de estación (solo se muestra después de elegir una línea) */}
      {selectedLinea && (
        <>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowEstacionesDropdown(!showEstacionesDropdown)}>
            <Text style={styles.dropdownText}>
              {selectedStation || "Selecciona una estación"}
            </Text>
          </TouchableOpacity>

          {showEstacionesDropdown && (
            <FlatList
              data={getStationsByLine(selectedLinea)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.stationItem} onPress={() => {
                  setSelectedStation(item);
                  setShowEstacionesDropdown(false);
                }}>
                  <Text style={styles.stationText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </>
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
  lineItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  lineText: { fontSize: 16, fontWeight: "bold" },
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
