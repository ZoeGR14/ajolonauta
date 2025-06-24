import { lineas, lines } from "@/assets/data/info";
import { db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

// Habilitar animaciones en Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TABS = ["Comentarios", "X  /  Twitter"];

// Colores personalizados por línea
const lineaColors: { [key: string]: string } = {
  "Línea 1": "#FFBCD4",
  "Línea 2": "#AFE3FF",
  "Línea 3": "#E2DCB4",
  "Línea 4": "#AACBC5",
  "Línea 5": "#FFE15B",
  "Línea 6": "#FFACAC",
  "Línea 7": "#FFDECA",
  "Línea 8": "#A4D6C2",
  "Línea 9": "#A78474",
  "Línea A": "#C790C6",
  "Línea B": "#D9D9D9",
  "Línea 12": "#E0C98C",
};

export default function CombinedView() {
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

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Comentarios");
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [comments, setComments] = useState<
    { usuario: string; texto: string; hora: string }[]
  >([]);
  const [showLineasDropdown, setShowLineasDropdown] = useState(false);
  const [showEstacionesDropdown, setShowEstacionesDropdown] = useState(false);

  const getStationsByLine = (lineaId: string) => {
    const linea = lines.find((l) => l.linea === lineaId);
    return linea ? linea.estaciones.map((est) => est.nombre) : [];
  };

  const fetchComments = async (stationName: string, lineaName: string) => {
    setLoading(true);
    try {
      const estacionId = `${stationName.replace("/", "|")} - ${lineaName}`;
      const docSnap = await getDoc(doc(db, "estaciones", estacionId));

      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedComments = data.comentarios || [];
        setComments(loadedComments.slice(-10));
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron cargar los comentarios.");
    }
    setLoading(false);
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
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut
              );
              setShowLineasDropdown(!showLineasDropdown);
            }}
          >
            <Text style={styles.dropdownText}>
              {selectedLinea ? `🚇 ${selectedLinea}` : "Selecciona una línea ▼"}
            </Text>
          </TouchableOpacity>

          {showLineasDropdown && (
            <FlatList
              data={lineas}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const bgColor = lineaColors[item];
                return (
                  <TouchableOpacity
                    style={[styles.lineItem, { backgroundColor: bgColor }]}
                    onPress={() => {
                      setSelectedLinea(item);
                      setShowLineasDropdown(false);
                      setShowEstacionesDropdown(true);
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                      );
                    }}
                  >
                    <Text style={[styles.lineText, { color: "#fff" }]}>
                      🚇 {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Selector de estación */}
          {selectedLinea && (
            <>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut
                  );
                  setShowEstacionesDropdown(!showEstacionesDropdown);
                }}
              >
                <Text style={styles.dropdownText}>
                  {selectedStation
                    ? `📍 ${selectedStation}`
                    : "Selecciona una estación ▼"}
                </Text>
              </TouchableOpacity>

              {showEstacionesDropdown && (
                <FlatList
                  data={getStationsByLine(selectedLinea)}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.stationItem}
                      onPress={() => {
                        setSelectedStation(item);
                        setShowEstacionesDropdown(false);
                        fetchComments(item, selectedLinea);
                        LayoutAnimation.configureNext(
                          LayoutAnimation.Presets.easeInEaseOut
                        );
                      }}
                    >
                      <Text style={styles.stationText}>📍 {item}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          )}

          {/* Comentarios */}
          {selectedStation ? (
            isLoading ? (
              <View style={styles.container}>
                <ActivityIndicator size="large" color="#e68059" />
              </View>
            ) : comments.length > 0 ? (
              <FlatList
                data={comments}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }) => (
                  <View style={styles.comment}>
                    <Text style={styles.commentText}>{item.texto}</Text>
                    <Text style={styles.commentUser}>👤 {item.usuario}</Text>
                    <Text style={styles.commentTime}>⏰ {item.hora}</Text>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.noComments}>
                No hay comentarios disponibles.
              </Text>
            )
          ) : (
            <Text style={styles.noComments}>
              Selecciona una línea y una estación
            </Text>
          )}
        </View>
      )}

      {/* Twitter */}
      {activeTab === "X  /  Twitter" && (
        <WebView
          source={{ uri: "https://x.com/MetroCDMX" }}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      )}

      {/* Botón flotante */}
      <Pressable style={styles.fab} onPress={() => router.push("/crearAviso")}>
        <Feather name="plus" size={24} color="white" />
      </Pressable>
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
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 10,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  lineItem: {
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lineText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  stationItem: {
    backgroundColor: "#fefefe",
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  stationText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#444",
  },
  comment: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 5,
    /*borderLeftWidth: 2,
    borderLeftColor: "#aaa",
    borderBottomColor: "#aaa",
    borderBottomWidth: 2,*/
  },
  commentText: {
    fontSize: 16,
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
  commentTime: {
    fontSize: 12,
    color: "gray",
    marginTop: 2,
  },
  noComments: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#999",
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
  fabText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
});
