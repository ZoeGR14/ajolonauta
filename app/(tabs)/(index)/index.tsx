import { lineas, lines } from "@/assets/data/info"; // 🔥 Importando datos desde info.ts
import { db } from "@/FirebaseConfig";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const TABS = ["Comentarios", "Twitter"];

export default function CombinedView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Comentarios");
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [comments, setComments] = useState<{ usuario: string; texto: string; hora: string }[]>([]);
  const [showLineasDropdown, setShowLineasDropdown] = useState(false);
  const [showEstacionesDropdown, setShowEstacionesDropdown] = useState(false);

  // Obtener estaciones de la línea seleccionada
  const getStationsByLine = (lineaId: string) => {
    const linea = lines.find(l => l.linea === lineaId);
    return linea ? linea.estaciones.map(est => est.nombre) : [];
  };

  // Obtener comentarios de la estación seleccionada
  const fetchComments = async (stationName: string, lineaName: string) => {
    try {
      const estacionId = `${stationName} - ${lineaName.replace("Línea", "Linea")}`;
      const docSnap = await getDoc(doc(db, "estaciones", estacionId));
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedComments = data.comentarios || [];
        setComments(loadedComments.slice(-10));
      } else {
        setComments([]);
        Alert.alert("Sin comentarios", "Esta estación no tiene comentarios.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron cargar los comentarios.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Comentarios */}
      {activeTab === "Comentarios" && (
        <View style={{ flex: 1 }}>
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

          {/* Selector de estación */}
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
                      fetchComments(item, selectedLinea);
                    }}>
                      <Text style={styles.stationText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          )}

          {/* Lista de comentarios */}
          {selectedStation && comments.length > 0 ? (
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
      )}

      {/* Twitter */}
      {activeTab === "Twitter" && (
        <WebView
          source={{ uri: "https://x.com/MetroCDMX" }}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      )}

      {/* Botón flotante para crear aviso */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/crearAviso")}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  tabContainer: {
    flexDirection: "row",
    margin: 12,
    borderRadius: 20,
    backgroundColor: "#eee",
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabText: {
    fontWeight: "bold",
  },
  dropdownButton: {
    backgroundColor: "#f1f1f1",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  dropdownText: { fontSize: 16, fontWeight: "bold" },
  lineItem: { padding: 10, borderBottomWidth: 1, borderColor: "#ccc", backgroundColor: "#fff" },
  lineText: { fontSize: 16, fontWeight: "bold" },
  stationItem: { padding: 10, borderBottomWidth: 1, borderColor: "#ccc", backgroundColor: "#fff" },
  stationText: { fontSize: 16 },
  comment: { backgroundColor: "#f9f9f9", padding: 10, borderRadius: 8, marginBottom: 10 },
  commentText: { fontSize: 16 },
  commentUser: { fontSize: 14, fontWeight: "bold", marginTop: 5 },
  commentTime: { fontSize: 12, color: "gray", marginTop: 2 },
  noComments: { textAlign: "center", marginTop: 20, color: "#888" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  fabText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
});
