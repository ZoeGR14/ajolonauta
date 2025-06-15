// app/(tabs)/(index)/(comentarios)/leerAvisos.tsx
import { db } from "@/FirebaseConfig";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from "react-native-webview";

const TABS = ["Comentarios", "X / Twitter"];

export default function CombinedView() {
  const [activeTab, setActiveTab] = useState("Comentarios");
  const [estaciones, setEstaciones] = useState<{ id: string; nombre: string }[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [comments, setComments] = useState<{ usuario: string; texto: string; hora: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const snapshot = await getDocs(collection(db, "estaciones"));
        const stationList = snapshot.docs.map((doc) => ({
          id: doc.id,
          nombre: doc.id,
        }));
        setEstaciones(stationList);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStations();
  }, []);

  const fetchComments = async (stationId: string) => {
    try {
      const docSnap = await getDoc(doc(db, "estaciones", stationId));
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
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownText}>
              {selectedStation
                ? estaciones.find((e) => e.id === selectedStation)?.nombre
                : "Selecciona una estación"}
            </Text>
          </TouchableOpacity>

          {showDropdown && (
            <FlatList
              data={estaciones}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.stationItem}
                  onPress={() => {
                    setSelectedStation(item.id);
                    setShowDropdown(false);
                    fetchComments(item.id);
                  }}
                >
                  <Text style={styles.stationText}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
            />
          )}

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
          ) : (
            selectedStation && <Text style={styles.noComments}>No hay comentarios.</Text>
          )}
        </View>
      )}

      {/* Twitter */}
      {activeTab === "X / Twitter" && (
        <WebView
          source={{ uri: "https://x.com/MetroCDMX" }}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      )}

      {/* FAB */}
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
    backgroundColor: "#edac93",
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#e68059",
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
  stationItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    marginHorizontal: 20,
  },
  stationText: { fontSize: 16 },
  comment: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    marginHorizontal: 20,
  },
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
    backgroundColor: "#e68059",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  fabText: {
    marginBottom: 5,
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
});
