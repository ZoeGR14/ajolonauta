import { db } from "@/FirebaseConfig";
import { lineas, lines } from "@/assets/data/info"; // 🔥 Importando líneas y estaciones desde info.ts
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import {
  checkStationStatus,
  formatTimeSinceClosed,
} from "@/utils/stationStatus";

const TABS = ["Comentarios", "Twitter"];

export default function CombinedView() {
  const [activeTab, setActiveTab] = useState("Comentarios");
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [comments, setComments] = useState<
    { usuario: string; texto: string; hora: string }[]
  >([]);
  const [showLineasDropdown, setShowLineasDropdown] = useState(false);
  const [showEstacionesDropdown, setShowEstacionesDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stationClosed, setStationClosed] = useState<any>(null);

  // Obtener estaciones de la línea seleccionada
  const getStationsByLine = (lineaId: string) => {
    const linea = lines.find((l) => l.linea === lineaId);
    return linea ? linea.estaciones.map((est) => est.nombre) : [];
  };

  // Obtener comentarios de la estación seleccionada
  const fetchComments = async (stationName: string, lineaName: string) => {
    setLoading(true);
    try {
      const estacionId = `${stationName} - ${lineaName.replace(
        "Línea",
        "Linea"
      )}`; // 🔥 Corrige el nombre de línea

      // Verificar estado de la estación
      const status = await checkStationStatus(estacionId);
      setStationClosed(status.cerrada ? status : null);

      const docSnap = await getDoc(doc(db, "estaciones", estacionId));

      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedComments = data.comentarios || [];
        setComments(loadedComments.slice(-10)); // 🔥 Mostrar solo los últimos 10 comentarios
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron cargar los comentarios.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes en Vivo</Text>
        <Text style={styles.headerSubtitle}>
          Información compartida por la comunidad
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab === "Comentarios" ? "chatbubbles" : "logo-twitter"}
              size={20}
              color={activeTab === tab ? "#e68059" : "#95a5a6"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Comentarios */}
      {activeTab === "Comentarios" && (
        <View style={{ flex: 1 }}>
          {/* Selector de línea */}
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowLineasDropdown(!showLineasDropdown)}
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

          {showLineasDropdown && (
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setShowLineasDropdown(false)}
              />
              <View style={styles.modalCard}>
                <View style={styles.dropdownHeader}>
                  <Text style={styles.dropdownHeaderText}>
                    Selecciona una línea
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowLineasDropdown(false)}
                  >
                    <Ionicons name="close-circle" size={28} color="#95a5a6" />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.dropdownScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {lineas.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.lineItem}
                      onPress={() => {
                        setSelectedLinea(item);
                        setShowLineasDropdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.lineContent}>
                        <Ionicons name="subway" size={22} color="#e68059" />
                        <Text style={styles.lineText}>{item}</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={18}
                          color="#95a5a6"
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {/* Selector de estación (solo se muestra después de elegir una línea) */}
          {selectedLinea && (
            <>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() =>
                  setShowEstacionesDropdown(!showEstacionesDropdown)
                }
              >
                <View style={styles.dropdownContent}>
                  <Ionicons name="location" size={22} color="#e68059" />
                  <Text style={styles.dropdownText}>
                    {selectedStation || "Selecciona una estación"}
                  </Text>
                  <Ionicons
                    name={
                      showEstacionesDropdown ? "chevron-up" : "chevron-down"
                    }
                    size={22}
                    color="#95a5a6"
                  />
                </View>
              </TouchableOpacity>

              {showEstacionesDropdown && (
                <View style={styles.modalOverlay}>
                  <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowEstacionesDropdown(false)}
                  />
                  <View style={styles.modalCard}>
                    <View style={styles.dropdownHeader}>
                      <Text style={styles.dropdownHeaderText}>
                        Selecciona una estación
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowEstacionesDropdown(false)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={28}
                          color="#95a5a6"
                        />
                      </TouchableOpacity>
                    </View>
                    <ScrollView
                      style={styles.dropdownScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {getStationsByLine(selectedLinea).map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={styles.stationItem}
                          onPress={() => {
                            setSelectedStation(item);
                            setShowEstacionesDropdown(false);
                            fetchComments(item, selectedLinea);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.stationContent}>
                            <View style={styles.stationIcon}>
                              <Ionicons
                                name="location"
                                size={16}
                                color="#e68059"
                              />
                            </View>
                            <Text style={styles.stationText}>{item}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
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
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color="#e74c3c"
                  />
                  <Text style={styles.closedStatText}>
                    {stationClosed.cantidadReportes}+ reportes
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Lista de comentarios */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e68059" />
              <Text style={styles.loadingText}>Cargando reportes...</Text>
            </View>
          ) : selectedStation && comments.length > 0 ? (
            <FlatList
              data={comments}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12 }}
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
          ) : selectedStation ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={64}
                  color="#bdc3c7"
                />
              </View>
              <Text style={styles.noComments}>Sin reportes aún</Text>
              <Text style={styles.noCommentsSubtitle}>
                Sé el primero en compartir información
              </Text>
            </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },
  header: {
    backgroundColor: "#e68059",
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#e68059",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    margin: 20,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    gap: 8,
  },
  activeTab: {
    backgroundColor: "#fff5f2",
  },
  tabText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#95a5a6",
  },
  activeTabText: {
    color: "#e68059",
  },
  listContainer: {
    maxHeight: 280,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: "88%",
    maxHeight: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
    overflow: "hidden",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: "#ffffff",
    borderBottomWidth: 2,
    borderBottomColor: "#f0f0f0",
  },
  dropdownHeaderText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2c3e50",
  },
  dropdownScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  dropdownButton: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginBottom: 12,
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
    padding: 18,
    marginVertical: 8,
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: "#f8f9fa",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: "#e68059",
  },
  lineContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lineText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
  },
  stationItem: {
    padding: 18,
    marginVertical: 6,
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: "#f8f9fa",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: "#e68059",
  },
  stationContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff5f2",
    justifyContent: "center",
    alignItems: "center",
  },
  stationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
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
});
