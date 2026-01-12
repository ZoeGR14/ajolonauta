import { lineas, lines } from "@/assets/data/info";
import { db } from "@/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
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

// Iconos de líneas de metro
const lineaIcons: { [key: string]: any } = {
  "Línea 1": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_1.png"),
  "Línea 2": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_2.png"),
  "Línea 3": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_3.png"),
  "Línea 4": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_4.png"),
  "Línea 5": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_5.png"),
  "Línea 6": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_6.png"),
  "Línea 7": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_7.png"),
  "Línea 8": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_8.png"),
  "Línea 9": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_9.png"),
  "Línea A": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_A.png"),
  "Línea B": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_B.png"),
  "Línea 12": require("@/assets/images/Lineas_Metro/MetroCDMX_Línea_12.png"),
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Función para calcular tiempo transcurrido
const getTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Ahora mismo";
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
};

// Función para formatear tiempo desde que una estación está cerrada
const formatTimeSinceClosed = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} min`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

// Función para generar color de avatar basado en userId
const getAvatarColor = (userId: string): string => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
    "#F8B739",
    "#52B788",
    "#FF8E72",
    "#A8DADC",
    "#E63946",
    "#F1C40F",
    "#9B59B6",
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

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
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
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
  const [comments, setComments] = useState<
    {
      usuario: string;
      texto: string;
      hora: string;
      timestamp: number;
      userId: string;
      photoURL?: string;
    }[]
  >([]);
  const [stationClosed, setStationClosed] = useState<any>(null);
  const [estacionesCerradas, setEstacionesCerradas] = useState<string[]>([]);
  const [unsubscribeStationClosed, setUnsubscribeStationClosed] = useState<
    (() => void) | null
  >(null);

  // Escuchar en tiempo real las estaciones cerradas
  useFocusEffect(
    useCallback(() => {
      const collectionRef = collection(db, "estaciones_cerradas");
      const q = query(collectionRef);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => doc.id);
        setEstacionesCerradas(data);
        console.log("📍 Estaciones cerradas actualizadas:", data);
      });
      return unsubscribe;
    }, [])
  );

  const getStationsByLine = (lineaId: string) => {
    const linea = lines.find((l) => l.linea === lineaId);
    return linea ? linea.estaciones.map((est) => est.nombre) : [];
  };

  // Función para verificar si una estación está cerrada y obtener sus datos
  const checkStationStatus = async (estacionId: string) => {
    const isClosed = estacionesCerradas.includes(estacionId);
    console.log(
      `🔍 Verificando ${estacionId}: ${isClosed ? "CERRADA" : "ABIERTA"}`
    );

    if (isClosed) {
      try {
        // Obtener datos completos del documento de estaciones_cerradas
        const closedDocSnap = await getDoc(
          doc(db, "estaciones_cerradas", estacionId)
        );
        if (closedDocSnap.exists()) {
          const data = closedDocSnap.data();
          console.log("📊 Datos de estación cerrada:", data);
          return { cerrada: true, estacionId, ...data };
        }
      } catch (error) {
        console.error("Error al obtener datos de estación cerrada:", error);
      }
    }

    return { cerrada: false, estacionId };
  };

  const fetchComments = async (stationName: string, lineaName: string) => {
    setLoading(true);
    try {
      // Mantener los acentos en el ID de la estación
      const estacionId = `${stationName.replace("/", "|")} - ${lineaName}`;

      // Obtener datos de la estación primero para tener ultimaActualizacion
      const stationDocSnap = await getDoc(doc(db, "estaciones", estacionId));
      let ultimaActualizacionTimestamp = null;

      if (stationDocSnap.exists()) {
        const stationData = stationDocSnap.data();
        // Obtener ultimaActualizacion para el cálculo del tiempo
        if (stationData.ultimaActualizacion) {
          // Convertir Timestamp de Firestore a número
          ultimaActualizacionTimestamp = stationData.ultimaActualizacion
            .toMillis
            ? stationData.ultimaActualizacion.toMillis()
            : stationData.ultimaActualizacion;
        }

        // Cargar comentarios
        const loadedComments = stationData.comentarios || [];
        setComments(loadedComments.slice(-20).reverse());
      } else {
        setComments([]);
      }

      // Verificar estado inicial
      const status = await checkStationStatus(estacionId);
      if (status.cerrada) {
        setStationClosed({
          ...status,
          ultimaActualizacion: ultimaActualizacionTimestamp,
        });
      } else {
        setStationClosed(null);
      }

      // Listener en tiempo real para el estado de estación cerrada
      const closedStationRef = doc(db, "estaciones_cerradas", estacionId);
      const unsubscribeClosed = onSnapshot(
        closedStationRef,
        async (closedDocSnap) => {
          if (closedDocSnap.exists()) {
            const closedData = closedDocSnap.data();

            // Obtener ultimaActualizacion actualizada de estaciones
            const updatedStationSnap = await getDoc(
              doc(db, "estaciones", estacionId)
            );
            let updatedTimestamp = null;

            if (updatedStationSnap.exists()) {
              const updatedStationData = updatedStationSnap.data();
              if (updatedStationData.ultimaActualizacion) {
                updatedTimestamp = updatedStationData.ultimaActualizacion
                  .toMillis
                  ? updatedStationData.ultimaActualizacion.toMillis()
                  : updatedStationData.ultimaActualizacion;
              }
            }

            console.log(
              "🔄 Actualización en tiempo real - Estación cerrada:",
              closedData
            );
            console.log("⏰ Última actualización timestamp:", updatedTimestamp);

            setStationClosed({
              cerrada: true,
              estacionId,
              ...closedData,
              ultimaActualizacion: updatedTimestamp,
            });
          } else {
            console.log("✅ Estación reabierta en tiempo real");
            setStationClosed(null);
          }
        }
      );

      setLoading(false);

      // Guardar cleanup function para cuando cambie de estación
      return unsubscribeClosed;
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron cargar los comentarios.");
      setLoading(false);
    }
  };

  const handleLineSelect = (linea: string) => {
    // Limpiar listener anterior si existe
    if (unsubscribeStationClosed) {
      unsubscribeStationClosed();
      setUnsubscribeStationClosed(null);
    }

    setSelectedLinea(linea);
    setSelectedStation(null);
    setComments([]);
    setStationClosed(null);
    setShowLineasSheet(false);
    // Abrir automáticamente estaciones para fluidez
    setTimeout(() => setShowEstacionesSheet(true), 300);
  };

  const handleStationSelect = async (station: string) => {
    // Limpiar listener anterior si existe
    if (unsubscribeStationClosed) {
      unsubscribeStationClosed();
      setUnsubscribeStationClosed(null);
    }

    setSelectedStation(station);
    setShowEstacionesSheet(false);
    if (selectedLinea) {
      const unsubscribe = await fetchComments(station, selectedLinea);
      if (unsubscribe) {
        setUnsubscribeStationClosed(() => unsubscribe);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Súper Llamativo */}
      <View style={styles.headerGradient}>
        {/* Elementos decorativos para simular gradiente */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />

        <View style={styles.headerContent}>
          {/* Icono Hero */}
          <View style={styles.heroIconContainer}>
            <View style={styles.heroIconBg}>
              <Ionicons name="subway" size={40} color="#fff" />
            </View>
          </View>

          {/* Títulos */}
          <Text style={styles.headerMainTitle}>REPORTES</Text>
          <Text style={styles.headerSubtitleNew}>DE LA COMUNIDAD</Text>

          {/* Live Indicator Animado */}
          <View style={styles.liveBadgeNew}>
            <View style={styles.pulsingDot} />
            <Text style={styles.liveTextNew}>EN TIEMPO REAL</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="people" size={18} color="#fff" />
              <Text style={styles.statText}>Usuarios</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={styles.statText}>Actualizaciones</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Filtros de Selección Mejorados */}
        <View style={styles.filtersSection}>
          <Text style={styles.filtersSectionTitle}>
            📍 Selecciona tu ubicación
          </Text>
          <View style={styles.filtersRow}>
            {/* Selector Línea */}
            <TouchableOpacity
              style={[
                styles.filterCard,
                selectedLinea && {
                  borderColor: lineaColors[selectedLinea],
                  borderWidth: 2,
                  backgroundColor: lineaColors[selectedLinea] + "10",
                  elevation: 0,
                  shadowOpacity: 0,
                },
              ]}
              onPress={() => setShowLineasSheet(true)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.filterIcon,
                  {
                    backgroundColor: selectedLinea
                      ? lineaColors[selectedLinea]
                      : "#E5E7EB",
                  },
                ]}
              >
                <Ionicons
                  name="train"
                  size={22}
                  color={selectedLinea ? "#fff" : "#6B7280"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabel}>LÍNEA</Text>
                <Text style={styles.filterValue} numberOfLines={1}>
                  {selectedLinea
                    ? selectedLinea.replace("Línea ", "L")
                    : "Elige línea"}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={20}
                color={selectedLinea ? lineaColors[selectedLinea] : "#9CA3AF"}
              />
            </TouchableOpacity>

            {/* Selector Estación */}
            <TouchableOpacity
              style={[
                styles.filterCard,
                !selectedLinea && styles.filterCardDisabled,
                selectedStation && {
                  borderColor: "#10B981",
                  borderWidth: 2,
                  backgroundColor: "#ECFDF5",
                },
              ]}
              onPress={() => selectedLinea && setShowEstacionesSheet(true)}
              disabled={!selectedLinea}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.filterIcon,
                  {
                    backgroundColor: selectedStation ? "#10B981" : "#E5E7EB",
                  },
                ]}
              >
                <Ionicons
                  name="location"
                  size={22}
                  color={selectedStation ? "#fff" : "#6B7280"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabel}>ESTACIÓN</Text>
                <Text style={styles.filterValue} numberOfLines={1}>
                  {selectedStation || "Elige estación"}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={20}
                color={selectedStation ? "#10B981" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Alerta de Cierre Mejorada */}
        {stationClosed && (
          <View style={styles.alertBoxNew}>
            <View style={styles.alertIconContainer}>
              <View style={styles.alertIconBg}>
                <Ionicons name="warning" size={32} color="#fff" />
              </View>
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitleNew}>🚨 ESTACIÓN CERRADA</Text>
              <Text style={styles.alertDescNew}>
                Alta actividad de reportes detectada en tiempo real.
              </Text>
              <View style={styles.alertStatsNew}>
                <View style={styles.alertStatItem}>
                  <Ionicons name="time" size={16} color="#DC2626" />
                  <Text style={styles.alertStatTextNew}>
                    {stationClosed.ultimaActualizacion
                      ? formatTimeSinceClosed(stationClosed.ultimaActualizacion)
                      : "N/A"}
                  </Text>
                </View>
                <View style={styles.alertStatItem}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.alertStatTextNew}>
                    {stationClosed.cantidadReportes || 0}+ reportes
                  </Text>
                </View>
              </View>
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
          <View style={{ flex: 1 }}>
            <View style={styles.listHeader}>
              <View style={styles.listTitleContainer}>
                <Ionicons name="chatbubbles" size={20} color="#e68059" />
                <Text style={styles.listTitle}>Reportes en vivo</Text>
              </View>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeText}>{comments.length}</Text>
              </View>
            </View>
            <FlatList
              data={comments}
              keyExtractor={(item, index) => `${item.userId}-${index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const avatarColor = getAvatarColor(item.userId || "anon");
                const timeAgo = item.timestamp
                  ? getTimeAgo(item.timestamp)
                  : item.hora;

                return (
                  <View
                    style={[
                      styles.reportCard,
                      { borderLeftColor: avatarColor },
                    ]}
                  >
                    {/* Header con foto de perfil */}
                    <View style={styles.reportHeader}>
                      <View
                        style={[
                          styles.profilePicture,
                          { backgroundColor: avatarColor },
                        ]}
                      >
                        {item.photoURL ? (
                          <Image
                            source={{ uri: item.photoURL }}
                            style={styles.profileImage}
                          />
                        ) : (
                          <Text style={styles.profileInitial}>
                            {item.usuario?.charAt(0)?.toUpperCase() || "?"}
                          </Text>
                        )}
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {item.usuario || "Usuario"}
                        </Text>
                        <View style={styles.timeContainer}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color="#9CA3AF"
                          />
                          <Text style={styles.timeText}>{timeAgo}</Text>
                        </View>
                      </View>
                      {index === 0 && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>NUEVO</Text>
                        </View>
                      )}
                    </View>

                    {/* Contenido del reporte */}
                    <Text style={styles.reportText}>{item.texto}</Text>

                    {/* Footer con interacciones */}
                    <View style={styles.reportFooter}>
                      <View style={styles.reportTag}>
                        <Ionicons name="location" size={12} color="#6B7280" />
                        <Text style={styles.reportTagText}>
                          {selectedStation}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons
                name={
                  selectedStation ? "chatbox-ellipses-outline" : "map-outline"
                }
                size={50}
                color="#e68059"
              />
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
      <Modal
        visible={showLineasSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLineasSheet(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowLineasSheet(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Selecciona una Línea</Text>
            <FlatList
              data={lineas}
              numColumns={3}
              keyExtractor={(item) => item}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.gridItem, { borderColor: lineaColors[item] }]}
                  onPress={() => handleLineSelect(item)}
                >
                  {lineaIcons[item] && (
                    <Image
                      source={lineaIcons[item]}
                      style={styles.lineIcon}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={styles.gridItemText}>
                    {item.replace("Línea ", "L")}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Selector de Estaciones */}
      <Modal
        visible={showEstacionesSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEstacionesSheet(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowEstacionesSheet(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.bottomSheet, { height: SCREEN_HEIGHT * 0.7 }]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Selecciona la Estación</Text>
            <FlatList
              data={selectedLinea ? getStationsByLine(selectedLinea) : []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => handleStationSelect(item)}
                >
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
  container: { flex: 1, backgroundColor: "#F3F4F6" },

  /* Header Styles con efecto visual */
  headerGradient: {
    backgroundColor: "#e63946",
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
    position: "relative",
  },
  decorativeCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(247, 127, 0, 0.3)",
    top: -80,
    right: -50,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(252, 191, 73, 0.25)",
    bottom: -30,
    left: -40,
  },
  decorativeCircle3: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: 50,
    left: 30,
  },
  headerContent: {
    paddingHorizontal: 24,
    alignItems: "center",
    zIndex: 1,
  },
  heroIconContainer: {
    marginBottom: 16,
  },
  heroIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  headerMainTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitleNew: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  liveBadgeNew: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
  },
  liveTextNew: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1F2937",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  statText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
  },

  content: { flex: 1, marginTop: -10 },

  /* Sección de Filtros */
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  filtersSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 12,
  },
  filtersRow: { flexDirection: "row", gap: 12 },
  filterCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 18,
    gap: 10,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterCardDisabled: { opacity: 0.5, backgroundColor: "#F9FAFB" },
  filterIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 9,
    color: "#6B7280",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  filterValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "800",
  },

  /* Alerta Mejorada */
  alertBoxNew: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 6,
    borderLeftColor: "#DC2626",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  alertIconContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  alertIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  alertContent: {
    alignItems: "center",
  },
  alertTitleNew: {
    fontSize: 18,
    fontWeight: "900",
    color: "#991B1B",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  alertDescNew: {
    fontSize: 14,
    color: "#7F1D1D",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  alertStatsNew: {
    flexDirection: "row",
    gap: 20,
  },
  alertStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  alertStatTextNew: {
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "700",
  },

  /* Lista */
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  listTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  listTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  badgeCount: {
    backgroundColor: "#e68059",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },

  /* Tarjetas de Reportes Mejoradas */
  reportCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  profilePicture: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
  },
  profileInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  newBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  reportText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  reportTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reportTagText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },

  /* Estados Vacíos / Carga */
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#e68059", fontWeight: "600" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 5,
  },
  emptyDesc: { fontSize: 14, color: "#9CA3AF", textAlign: "center" },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e68059",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#e68059",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  /* Modales Bottom Sheet */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },

  gridItem: {
    width: "30%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  lineIcon: {
    width: 45,
    height: 45,
    marginBottom: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
  gridItemText: { fontWeight: "700", color: "#374151" },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  listItemText: { fontSize: 16, color: "#374151", flex: 1, fontWeight: "500" },
});
