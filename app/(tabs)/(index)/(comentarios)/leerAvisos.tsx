import { db } from "@/FirebaseConfig";
import { lineas, lines } from "@/assets/data/info";
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
  SafeAreaView,
  StatusBar,
} from "react-native";
import { WebView } from "react-native-webview";
import {
  checkStationStatus,
  formatTimeSinceClosed,
} from "@/utils/stationStatus";

const TABS = ["Comentarios", "Twitter"];

const lineaColors: { [key: string]: string } = {
  "Línea 1": "#f0658f",
  "Línea 2": "#0571b9",
  "Línea 3": "#bcb600",
  "Línea 4": "#81c5b8",
  "Línea 5": "#fae202",
  "Línea 6": "#e61f24",
  "Línea 7": "#eb8519",
  "Línea 8": "#0b9557",
  "Línea 9": "#461e04",
  "Línea A": "#970081",
  "Línea B": "#c5c5c5",
  "Línea 12": "#b4a442",
};

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

  const getStationsByLine = (lineaId: string) => {
    const linea = lines.find((l) => l.linea === lineaId);
    return linea ? linea.estaciones.map((est) => est.nombre) : [];
  };

  const fetchComments = async (stationName: string, lineaName: string) => {
    setLoading(true);
    try {
      const estacionId = `${stationName} - ${lineaName.replace(
        "Línea",
        "Linea"
      )}`;
      const status = await checkStationStatus(estacionId);
      setStationClosed(status.cerrada ? status : null);

      const docSnap = await getDoc(doc(db, "estaciones", estacionId));

      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedComments = data.comentarios || [];
        setComments(loadedComments.slice(-10).reverse()); // Invertimos para ver el más reciente arriba
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.headerTitle}>Reportes en Vivo</Text>
          <Text style={styles.headerSubtitle}>Estado del servicio</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.segmentedControl}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.segmentBtn,
              activeTab === tab && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab === "Comentarios" ? "chatbubbles-sharp" : "logo-twitter"}
              size={18}
              color={activeTab === tab ? "#fff" : "#888"}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === tab && styles.segmentTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderHeader()}

      <View style={styles.contentContainer}>
        {activeTab === "Comentarios" && (
          <View style={{ flex: 1 }}>
            {/* Filtros Container */}
            <View style={styles.filtersContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedLinea ? styles.filterButtonActive : null,
                  { borderColor: selectedLinea ? lineaColors[selectedLinea] : 'transparent' }
                ]}
                onPress={() => setShowLineasDropdown(true)}
              >
                <View style={[styles.iconBadge, { backgroundColor: selectedLinea ? lineaColors[selectedLinea] : '#F0F2F5' }]}>
                   <Ionicons name="git-branch" size={18} color={selectedLinea ? "#fff" : "#A0A0A0"} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.filterLabel}>Línea</Text>
                    <Text numberOfLines={1} style={styles.filterValue}>{selectedLinea || "Seleccionar"}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#ccc" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                    styles.filterButton, 
                    selectedStation ? styles.filterButtonActive : null,
                    !selectedLinea && styles.filterButtonDisabled
                ]}
                onPress={() => {
                    if(selectedLinea) setShowEstacionesDropdown(true)
                }}
                disabled={!selectedLinea}
              >
                 <View style={[styles.iconBadge, { backgroundColor: selectedStation ? '#4CAF50' : '#F0F2F5' }]}>
                   <Ionicons name="location" size={18} color={selectedStation ? "#fff" : "#A0A0A0"} />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.filterLabel}>Estación</Text>
                    <Text numberOfLines={1} style={styles.filterValue}>{selectedStation || "Seleccionar"}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#ccc" />
              </TouchableOpacity>
            </View>

            {/* Alertas */}
            {stationClosed && (
              <View style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <Ionicons name="warning" size={24} color="#D32F2F" />
                  <Text style={styles.alertTitle}>ESTACIÓN CERRADA</Text>
                </View>
                <Text style={styles.alertDesc}>
                  Alta actividad de reportes detectada.
                </Text>
                <View style={styles.alertStats}>
                    <Text style={styles.alertStatText}>🕒 Hace {formatTimeSinceClosed(Date.now() - 15 * 60 * 1000)}</Text>
                    <Text style={styles.alertStatText}>⚠️ {stationClosed.cantidadReportes}+ reportes</Text>
                </View>
              </View>
            )}

            {/* Lista */}
            {loading ? (
              <View style={styles.centerView}>
                <ActivityIndicator size="large" color="#e68059" />
                <Text style={styles.loadingText}>Sincronizando reportes...</Text>
              </View>
            ) : selectedStation && comments.length > 0 ? (
              <FlatList
                data={comments}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.chatBubble}>
                    <View style={styles.chatHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.usuario.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={styles.username}>{item.usuario}</Text>
                        <Text style={styles.timestamp}>{item.hora}</Text>
                      </View>
                    </View>
                    <Text style={styles.commentBody}>{item.texto}</Text>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}>
                    <Ionicons name={selectedStation ? "chatbox-ellipses-outline" : "map-outline"} size={40} color="#e68059" />
                </View>
                <Text style={styles.emptyTitle}>
                  {selectedStation ? "Sin reportes recientes" : "Selecciona una ruta"}
                </Text>
                <Text style={styles.emptyDesc}>
                  {selectedStation 
                    ? "¡Sé el primero en reportar el estado de esta estación!" 
                    : "Elige una línea y estación para ver lo que está pasando."}
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "Twitter" && (
          <View style={styles.webviewContainer}>
            <WebView
              source={{ uri: "https://twitter.com/MetroCDMX" }}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </View>

      {/* Modales (Lineas) */}
      {showLineasDropdown && (
        <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowLineasDropdown(false)} />
            <View style={styles.bottomSheet}>
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Selecciona la Línea</Text>
                    <TouchableOpacity onPress={() => setShowLineasDropdown(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.gridContainer}>
                        {lineas.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[styles.gridItem, { borderColor: lineaColors[item] }]}
                                onPress={() => {
                                    setSelectedLinea(item);
                                    setSelectedStation(null); // Reset station
                                    setShowLineasDropdown(false);
                                }}
                            >
                                <View style={[styles.colorDot, { backgroundColor: lineaColors[item] }]} />
                                <Text style={styles.gridText}>{item.replace('Línea ', 'L')}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </View>
      )}

      {/* Modales (Estaciones) */}
      {showEstacionesDropdown && (
        <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowEstacionesDropdown(false)} />
            <View style={[styles.bottomSheet, { height: '70%' }]}>
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Selecciona la Estación</Text>
                    <TouchableOpacity onPress={() => setShowEstacionesDropdown(false)} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {selectedLinea && getStationsByLine(selectedLinea).map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={styles.listOption}
                            onPress={() => {
                                setSelectedStation(item);
                                setShowEstacionesDropdown(false);
                                fetchComments(item, selectedLinea);
                            }}
                        >
                            <Ionicons name="location-outline" size={22} color="#555" />
                            <Text style={styles.listOptionText}>{item}</Text>
                            <Ionicons name="chevron-forward" size={18} color="#ccc" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  headerContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#1A1A1A" },
  headerSubtitle: { fontSize: 14, color: "#888", fontWeight: "500" },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D32F2F", marginRight: 6 },
  liveText: { color: "#D32F2F", fontWeight: "800", fontSize: 10 },
  
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F0F2F5",
    borderRadius: 16,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: "#e68059",
    shadowColor: "#e68059",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  segmentText: { fontWeight: "600", color: "#888", fontSize: 14 },
  segmentTextActive: { color: "#fff" },

  contentContainer: { flex: 1 },
  filtersContainer: {
    flexDirection: "row",
    gap: 15,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
    gap: 10,
  },
  filterButtonActive: {
    backgroundColor: "#fff",
    borderWidth: 1,
  },
  filterButtonDisabled: {
    opacity: 0.6,
    backgroundColor: "#F5F5F5",
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterLabel: { fontSize: 10, color: "#999", fontWeight: "700", textTransform: 'uppercase' },
  filterValue: { fontSize: 14, color: "#333", fontWeight: "700" },

  /* List & Cards */
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  chatBubble: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chatHeader: { flexDirection: "row", marginBottom: 10, alignItems: "center", gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e68059",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  username: { fontWeight: "bold", fontSize: 15, color: "#333" },
  timestamp: { fontSize: 11, color: "#999" },
  commentBody: { fontSize: 15, color: "#444", lineHeight: 22 },

  /* States */
  centerView: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#666", fontWeight: "600" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyIconBg: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#FFEFEA", 
    justifyContent: "center", alignItems: "center", marginBottom: 20 
  },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 14, color: "#777", textAlign: "center", lineHeight: 20 },

  /* Alerts */
  alertCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#FFEBEE",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#D32F2F",
  },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 },
  alertTitle: { color: "#D32F2F", fontWeight: "900", fontSize: 14 },
  alertDesc: { color: "#B71C1C", fontSize: 14, marginBottom: 10 },
  alertStats: { flexDirection: "row", gap: 15 },
  alertStatText: { fontSize: 12, color: "#D32F2F", fontWeight: "600" },

  /* WebView */
  webviewContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },

  /* Bottom Sheet / Modal */
  modalOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1000,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    height: '50%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  sheetTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  closeBtn: { padding: 5, backgroundColor: '#f0f0f0', borderRadius: 20 },
  
  /* Grid de Líneas */
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  gridItem: {
    width: '30%',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 8 },
  gridText: { fontWeight: "700", color: "#333" },

  /* Lista de Estaciones */
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
    gap: 12,
  },
  listOptionText: { fontSize: 16, color: "#333", flex: 1 },

});