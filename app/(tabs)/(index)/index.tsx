import { lineas, lines } from "@/assets/data/info";
import { db } from "@/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  checkStationStatus,
  formatTimeSinceClosed,
} from "@/utils/stationStatus";

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
  const [stationClosed, setStationClosed] = useState<any>(null);

  const getStationsByLine = (lineaId: string) => {
    const linea = lines.find((l) => l.linea === lineaId);
    return linea ? linea.estaciones.map((est) => est.nombre) : [];
  };

  const fetchComments = async (stationName: string, lineaName: string) => {
    setLoading(true);
    try {
      const estacionId = `${stationName.replace("/", "|")} - ${lineaName}`;

      // Verificar estado de la estación
      const status = await checkStationStatus(estacionId);
      setStationClosed(status.cerrada ? status : null);

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="chatbubbles" size={28} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Reportes Activos</Text>
          <Text style={styles.headerSubtitle}>
            🗣️ Información en tiempo real de la comunidad
          </Text>
        </View>
      </View>

      {/* Selector de línea */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SELECCIONA UNA LÍNEA</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut
            );
            setShowLineasDropdown(!showLineasDropdown);
          }}
        >
          <View style={styles.dropdownContent}>
            <Ionicons name="train" size={22} color="#e68059" />
            <Text style={styles.dropdownText}>
              {selectedLinea || "Selecciona una línea"}
            </Text>
            <Ionicons
              name={showLineasDropdown ? "chevron-up" : "chevron-down"}
              size={22}
              color="#95a5a6"
            />
          </View>
        </TouchableOpacity>
      </View>

      {showLineasDropdown && (
        <FlatList
          data={lineas}
          keyExtractor={(item) => item}
          style={styles.listContainer}
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
                activeOpacity={0.7}
              >
                <View style={styles.lineContent}>
                  <Ionicons name="subway" size={24} color="#fff" />
                  <Text style={styles.lineText}>{item}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="rgba(255,255,255,0.7)"
                  />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Selector de estación */}
      {selectedLinea && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SELECCIONA UNA ESTACIÓN</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut
                );
                setShowEstacionesDropdown(!showEstacionesDropdown);
              }}
            >
              <View style={styles.dropdownContent}>
                <Ionicons name="location" size={22} color="#e68059" />
                <Text style={styles.dropdownText}>
                  {selectedStation || "Selecciona una estación"}
                </Text>
                <Ionicons
                  name={showEstacionesDropdown ? "chevron-up" : "chevron-down"}
                  size={22}
                  color="#95a5a6"
                />
              </View>
            </TouchableOpacity>
          </View>

          {showEstacionesDropdown && (
            <FlatList
              data={getStationsByLine(selectedLinea)}
              keyExtractor={(item) => item}
              style={styles.listContainer}
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
                  activeOpacity={0.7}
                >
                  <View style={styles.stationContent}>
                    <View style={styles.stationIcon}>
                      <Ionicons name="location" size={18} color="#e68059" />
                    </View>
                    <Text style={styles.stationText}>{item}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {/* Alerta de estación cerrada */}
      {stationClosed && (
        <View style={styles.closedAlert}>
          <View style={styles.closedAlertHeader}>
            <Ionicons name="warning" size={28} color="#e74c3c" />
            <Text style={styles.closedAlertTitle}>ESTACIÓN CERRADA</Text>
          </View>
          <Text style={styles.closedAlertText}>
            Esta estación ha sido marcada como cerrada por alta actividad de
            reportes
          </Text>
          <View style={styles.closedAlertStats}>
            <View style={styles.closedStat}>
              <Ionicons name="time-outline" size={16} color="#e74c3c" />
              <Text style={styles.closedStatText}>
                {formatTimeSinceClosed(Date.now() - 15 * 60 * 1000)}
              </Text>
            </View>
            <View style={styles.closedStat}>
              <Ionicons name="alert-circle-outline" size={16} color="#e74c3c" />
              <Text style={styles.closedStatText}>
                {stationClosed.cantidadReportes}+ reportes
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Comentarios */}
      {selectedStation ? (
        isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e68059" />
            <Text style={styles.loadingText}>Cargando reportes...</Text>
          </View>
        ) : comments.length > 0 ? (
          <View style={styles.commentsSection}>
            <View style={styles.commentsBadge}>
              <Ionicons name="chatbubbles" size={16} color="#e68059" />
              <Text style={styles.commentsCount}>
                {comments.length} Reportes
              </Text>
            </View>
            <FlatList
              data={comments}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={{ padding: 20, paddingTop: 12 }}
              renderItem={({ item, index }) => (
                <View
                  style={[styles.comment, { marginTop: index === 0 ? 0 : 12 }]}
                >
                  <View style={styles.commentHeader}>
                    <View style={styles.userAvatar}>
                      <Ionicons name="person" size={18} color="#fff" />
                    </View>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentUser}>{item.usuario}</Text>
                      <Text style={styles.commentTime}>{item.hora}</Text>
                    </View>
                  </View>
                  <Text style={styles.commentText}>{item.texto}</Text>
                </View>
              )}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={64} color="#bdc3c7" />
            </View>
            <Text style={styles.noComments}>Sin reportes aún</Text>
            <Text style={styles.noCommentsSubtitle}>
              Sé el primero en compartir información
            </Text>
          </View>
        )
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="map-outline" size={64} color="#bdc3c7" />
          </View>
          <Text style={styles.noComments}>Selecciona una estación</Text>
          <Text style={styles.noCommentsSubtitle}>
            para ver los reportes de la comunidad
          </Text>
        </View>
      )}

      {/* Botón flotante */}
      <Pressable style={styles.fab} onPress={() => router.push("/crearAviso")}>
        <View style={styles.fabContent}>
          <Ionicons name="add" size={28} color="white" />
        </View>
        <View style={styles.fabPulse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },
  header: {
    backgroundColor: "#e68059",
    paddingTop: 60,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#e68059",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7f8c8d",
    marginBottom: 10,
    letterSpacing: 1.2,
  },
  listContainer: {
    maxHeight: 300,
    marginTop: 8,
  },
  dropdownButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    marginLeft: 12,
  },
  lineItem: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    borderRadius: 18,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  lineContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lineText: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    marginLeft: 12,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  stationItem: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginVertical: 6,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#e68059",
  },
  stationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  stationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff5f2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stationText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "600",
    color: "#e68059",
  },
  commentsSection: {
    flex: 1,
  },
  commentsBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#fff5f2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 8,
  },
  commentsCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e68059",
  },
  comment: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e68059",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  commentMeta: {
    flex: 1,
  },
  commentUser: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2c3e50",
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    color: "#95a5a6",
    fontWeight: "600",
  },
  commentText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#34495e",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  noComments: {
    textAlign: "center",
    fontSize: 18,
    color: "#7f8c8d",
    fontWeight: "700",
    marginBottom: 8,
  },
  noCommentsSubtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#95a5a6",
    fontWeight: "600",
  },
  closedAlert: {
    backgroundColor: "#ffe5e5",
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e74c3c",
    shadowColor: "#e74c3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  closedAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  closedAlertTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#e74c3c",
    letterSpacing: 1,
  },
  closedAlertText: {
    fontSize: 14,
    color: "#c0392b",
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: "600",
  },
  closedAlertStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  closedStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    justifyContent: "center",
  },
  closedStatText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#e74c3c",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: "visible",
  },
  fabContent: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#e68059",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#e68059",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 10,
  },
  fabPulse: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#e68059",
    opacity: 0.3,
  },
  fabText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "800",
  },
});
