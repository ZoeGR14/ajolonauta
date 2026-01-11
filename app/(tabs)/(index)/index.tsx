import { lineas, lines } from "@/assets/data/info";
import { db } from "@/FirebaseConfig";
import { checkStationStatus, formatTimeSinceClosed } from "@/utils/stationStatus";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Colores por línea
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function IndexScreen() {
  // Manejo del botón físico de atrás (Android)
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
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const router = useRouter();
  
  // Estados de Selección
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  
  // Estados de UI (Modales y Carga)
  const [showLineasSheet, setShowLineasSheet] = useState(false);
  const [showEstacionesSheet, setShowEstacionesSheet] = useState(false);
  const [isLoading, setLoading] = useState(false);
  
  // Datos
  const [comments, setComments] = useState<{ usuario: string; texto: string; hora: string }[]>([]);
  const [stationClosed, setStationClosed] = useState<any>(null);

  const getStationsByLine = (lineaId: string) => {
    const linea = lines.find((l) => l.linea === lineaId);
    return linea ? linea.estaciones.map((est) => est.nombre) : [];
  };

  const fetchComments = async (stationName: string, lineaName: string) => {
    setLoading(true);
    try {
      // Ajuste de nombre para coincidir con IDs (ej: "Línea 1" -> "Linea 1")
      const lineaFixed = lineaName.replace("Línea", "Linea"); 
      const estacionId = `${stationName.replace("/", "|")} - ${lineaFixed}`;

      // Verificar estado
      const status = await checkStationStatus(estacionId);
      setStationClosed(status.cerrada ? status : null);

      // Obtener comentarios
      const docSnap = await getDoc(doc(db, "estaciones", estacionId));

      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedComments = data.comentarios || [];
        // Mostrar los más recientes primero (invertir array si vienen cronológicos)
        setComments(loadedComments.slice(-20).reverse());
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron cargar los comentarios.");
    }
    setLoading(false);
  };

  const handleLineSelect = (linea: string) => {
    setSelectedLinea(linea);
    setSelectedStation(null);
    setComments([]);
    setStationClosed(null);
    setShowLineasSheet(false);
    // Abrir automáticamente estaciones para fluidez
    setTimeout(() => setShowEstacionesSheet(true), 300);
  };

  const handleStationSelect = (station: string) => {
    setSelectedStation(station);
    setShowEstacionesSheet(false);
    if (selectedLinea) {
      fetchComments(station, selectedLinea);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header Moderno sin Tabs */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <View>
             <Text style={styles.headerTitle}>Estado del Metro</Text>
             <Text style={styles.headerSubtitle}>Reportes de la comunidad</Text>
          </View>
          <View style={styles.liveBadge}>
             <View style={styles.liveDot} />
             <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Filtros de Selección (Tarjetas) */}
        <View style={styles.filtersRow}>
            {/* Selector Línea */}
            <TouchableOpacity 
            style={[styles.filterCard, selectedLinea && { borderColor: lineaColors[selectedLinea] }]}
            onPress={() => setShowLineasSheet(true)}
            >
            <View style={[styles.filterIcon, { backgroundColor: selectedLinea ? lineaColors[selectedLinea] : '#f2f2f2' }]}>
                <Ionicons name="train" size={20} color={selectedLinea ? "#fff" : "#999"} />
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.filterLabel}>Línea</Text>
                <Text style={styles.filterValue} numberOfLines={1}>{selectedLinea || "Seleccionar"}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#ccc" />
            </TouchableOpacity>

            {/* Selector Estación */}
            <TouchableOpacity 
            style={[styles.filterCard, !selectedLinea && styles.filterCardDisabled]}
            onPress={() => selectedLinea && setShowEstacionesSheet(true)}
            disabled={!selectedLinea}
            >
            <View style={[styles.filterIcon, { backgroundColor: selectedStation ? '#4CAF50' : '#f2f2f2' }]}>
                <Ionicons name="location" size={20} color={selectedStation ? "#fff" : "#999"} />
            </View>
            <View style={{flex: 1}}>
                <Text style={styles.filterLabel}>Estación</Text>
                <Text style={styles.filterValue} numberOfLines={1}>{selectedStation || "Seleccionar"}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#ccc" />
            </TouchableOpacity>
        </View>

        {/* Alerta de Cierre */}
        {stationClosed && (
            <View style={styles.alertBox}>
                <View style={styles.alertHeader}>
                <Ionicons name="warning" size={22} color="#D32F2F" />
                <Text style={styles.alertTitle}>ESTACIÓN CERRADA</Text>
                </View>
                <Text style={styles.alertDesc}>Alta actividad de reportes detectada.</Text>
                <View style={styles.alertStats}>
                <Text style={styles.alertStatText}>🕒 Hace {formatTimeSinceClosed(Date.now() - 15 * 60 * 1000)}</Text>
                <Text style={styles.alertStatText}>⚠️ {stationClosed.cantidadReportes}+ reportes</Text>
                </View>
            </View>
        )}

        {/* Lista de Comentarios */}
        {isLoading ? (
            <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#e68059" />
                <Text style={styles.loadingText}>Cargando reportes...</Text>
            </View>
        ) : selectedStation && comments.length > 0 ? (
            <View style={{flex: 1}}>
                <View style={styles.listHeader}>
                    <Text style={styles.listTitle}>Últimos reportes</Text>
                    <View style={styles.badgeCount}>
                    <Text style={styles.badgeText}>{comments.length}</Text>
                    </View>
                </View>
                <FlatList
                data={comments}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.commentBubble}>
                        <View style={styles.bubbleHeader}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{item.usuario ? item.usuario.charAt(0).toUpperCase() : "A"}</Text>
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.userName}>{item.usuario}</Text>
                            <Text style={styles.timeText}>{item.hora}</Text>
                        </View>
                        </View>
                        <Text style={styles.commentText}>{item.texto}</Text>
                    </View>
                )}
                />
            </View>
        ) : (
            <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}>
                    <Ionicons name={selectedStation ? "chatbox-ellipses-outline" : "map-outline"} size={50} color="#e68059" />
                </View>
                <Text style={styles.emptyTitle}>
                    {selectedStation ? "Sin reportes aún" : "Selecciona una ruta"}
                </Text>
                <Text style={styles.emptyDesc}>
                    {selectedStation 
                    ? "Sé el primero en informar sobre esta estación." 
                    : "Selecciona una línea y estación para ver el estado."}
                </Text>
            </View>
        )}
      </View>

      {/* FAB: Crear Aviso */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(index)/(comentarios)/crearAviso")} // Asegura la ruta correcta
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal: Selector de Líneas */}
      <Modal visible={showLineasSheet} animationType="slide" transparent={true} onRequestClose={() => setShowLineasSheet(false)}>
         <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowLineasSheet(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.bottomSheet}>
               <View style={styles.sheetHandle} />
               <Text style={styles.sheetTitle}>Selecciona una Línea</Text>
               <FlatList 
                  data={lineas}
                  numColumns={3}
                  keyExtractor={(item) => item}
                  columnWrapperStyle={{justifyContent: 'space-between'}}
                  renderItem={({item}) => (
                     <TouchableOpacity 
                        style={[styles.gridItem, { borderColor: lineaColors[item] }]}
                        onPress={() => handleLineSelect(item)}
                     >
                        <View style={[styles.dot, { backgroundColor: lineaColors[item] }]} />
                        <Text style={styles.gridItemText}>{item.replace("Línea ", "L")}</Text>
                     </TouchableOpacity>
                  )}
               />
            </TouchableOpacity>
         </TouchableOpacity>
      </Modal>

      {/* Modal: Selector de Estaciones */}
      <Modal visible={showEstacionesSheet} animationType="slide" transparent={true} onRequestClose={() => setShowEstacionesSheet(false)}>
         <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowEstacionesSheet(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.bottomSheet, { height: SCREEN_HEIGHT * 0.7 }]}>
               <View style={styles.sheetHandle} />
               <Text style={styles.sheetTitle}>Selecciona la Estación</Text>
               <FlatList 
                  data={selectedLinea ? getStationsByLine(selectedLinea) : []}
                  keyExtractor={(item) => item}
                  renderItem={({item}) => (
                     <TouchableOpacity style={styles.listItem} onPress={() => handleStationSelect(item)}>
                        <Ionicons name="location-outline" size={22} color="#666" />
                        <Text style={styles.listItemText}>{item}</Text>
                        <Ionicons name="chevron-forward" size={18} color="#ccc" />
                     </TouchableOpacity>
                  )}
               />
            </TouchableOpacity>
         </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  
  /* Header Styles */
  headerContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#222" },
  headerSubtitle: { fontSize: 13, color: "#888", fontWeight: "600" },
  liveBadge: { 
     flexDirection: "row", alignItems: "center", backgroundColor: "#FFEBEE", 
     paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D32F2F" },
  liveText: { fontSize: 10, fontWeight: "800", color: "#D32F2F" },

  content: { flex: 1 },

  /* Filtros */
  filtersRow: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  filterCard: {
     flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", 
     padding: 12, borderRadius: 16, gap: 10,
     borderWidth: 1, borderColor: "#E5E7EB",
     shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 4, elevation: 1
  },
  filterCardDisabled: { opacity: 0.6, backgroundColor: "#F9FAFB" },
  filterIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  filterLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "700", textTransform: "uppercase" },
  filterValue: { fontSize: 14, color: "#374151", fontWeight: "700" },

  /* Alerta */
  alertBox: {
     marginHorizontal: 20, marginTop: 15, backgroundColor: "#FEF2F2", 
     padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: "#EF4444"
  },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  alertTitle: { color: "#B91C1C", fontWeight: "800", fontSize: 14 },
  alertDesc: { color: "#7F1D1D", fontSize: 13, marginBottom: 8 },
  alertStats: { flexDirection: "row", gap: 12 },
  alertStatText: { fontSize: 11, color: "#B91C1C", fontWeight: "600" },

  /* Lista */
  listHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
  listTitle: { fontSize: 16, fontWeight: "800", color: "#374151", flex: 1 },
  badgeCount: { backgroundColor: "#e68059", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  commentBubble: {
     backgroundColor: "#fff", padding: 16, borderRadius: 20, marginBottom: 12,
     shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
     borderBottomLeftRadius: 4 
  },
  bubbleHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FCD34D", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#78350F", fontWeight: "bold" },
  userName: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  timeText: { fontSize: 11, color: "#9CA3AF" },
  commentText: { fontSize: 14, color: "#4B5563", lineHeight: 20 },

  /* Estados Vacíos / Carga */
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#e68059", fontWeight: "600" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#FFF7ED", justifyContent: "center", alignItems: "center", marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#374151", marginBottom: 5 },
  emptyDesc: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },

  /* FAB */
  fab: {
     position: "absolute", bottom: 30, right: 25,
     width: 60, height: 60, borderRadius: 30, backgroundColor: "#e68059",
     justifyContent: "center", alignItems: "center",
     shadowColor: "#e68059", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8
  },

  /* Modales Bottom Sheet */
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  bottomSheet: {
     backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
     padding: 24, paddingBottom: 40, maxHeight: "80%"
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 20, textAlign: "center" },
  
  gridItem: {
     width: "30%", padding: 12, borderRadius: 12, borderWidth: 2, 
     alignItems: "center", marginBottom: 12, backgroundColor: "#fff"
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
  gridItemText: { fontWeight: "700", color: "#374151" },

  listItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", gap: 12 },
  listItemText: { fontSize: 16, color: "#374151", flex: 1, fontWeight: "500" },
});