import { lineas, lines } from "@/assets/data/info";
import { auth, db } from "@/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  arrayUnion,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

export default function AddComment() {
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [showLineasDropdown, setShowLineasDropdown] = useState(false);
  const [showEstacionesDropdown, setShowEstacionesDropdown] = useState(false);
  const [loading, setLoading] = useState(false); // <- nuevo estado

  const getStationsByLine = (lineaId: string) => {
    const linea = lines.find((l) => l.linea === lineaId);
    return linea ? linea.estaciones.map((est) => est.nombre) : [];
  };

  // Función para verificar si hay muchos reportes recientes
  const checkRecentReports = async (estacionId: string) => {
    try {
      const stationRef = doc(db, "estaciones", estacionId);
      const docSnap = await getDoc(stationRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const comentarios = data.comentarios || [];

        // Obtener timestamp de hace 15 minutos
        const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

        // Contar reportes en los últimos 15 minutos
        const recentReports = comentarios.filter((comment: any) => {
          return comment.timestamp && comment.timestamp >= fifteenMinutesAgo;
        });

        // Si hay 5 o más reportes, marcar como cerrada
        if (recentReports.length >= 5) {
          await markStationAsClosed(estacionId, recentReports);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error al verificar reportes recientes:", error);
      return false;
    }
  };

  // Función para marcar estación como cerrada
  const markStationAsClosed = async (
    estacionId: string,
    recentReports: any[]
  ) => {
    try {
      const closedStationRef = doc(db, "estaciones_cerradas", estacionId);
      const closedData = {
        estacionId: estacionId,
        estacion: selectedStation,
        linea: selectedLinea,
        estado: "cerrada",
        razon: "Alta actividad de reportes",
        cantidadReportes: recentReports.length,
        reportesRecientes: recentReports.slice(-10), // Últimos 10 reportes
        fechaCierre: Date.now(),
        fechaCierreFormato: new Date().toLocaleString(),
        timestampServidor: serverTimestamp(),
      };

      // Guardar en tabla de estaciones cerradas
      await setDoc(closedStationRef, closedData);

      // Actualizar la estación original con el estado
      const stationRef = doc(db, "estaciones", estacionId);
      await updateDoc(stationRef, {
        estadoCerrada: true,
        fechaCierre: Date.now(),
        ultimaActualizacion: serverTimestamp(),
      });

      console.log("Estación marcada como cerrada:", estacionId);
    } catch (error) {
      console.error("Error al marcar estación como cerrada:", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLinea || !selectedStation) {
      Alert.alert(
        "Error",
        "Selecciona una línea y una estación antes de continuar."
      );
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Error", "El comentario no puede estar vacío.");
      return;
    }
    if (comment.length > 200) {
      Alert.alert(
        "Error",
        "El comentario no puede superar los 200 caracteres."
      );
      return;
    }

    const estacionId = `${selectedStation.replace(
      "/",
      "|"
    )} - ${selectedLinea}`;

    setLoading(true);
    const stationRef = doc(db, "estaciones", estacionId);

    // Formato mejorado del comentario con timestamp numérico
    const ahora = Date.now();
    const comentario = {
      usuario: auth.currentUser?.displayName || "Anónimo",
      userId: auth.currentUser?.uid || "anonimo",
      texto: comment,
      timestamp: ahora, // Timestamp numérico para cálculos
      hora: new Date().toLocaleString(), // Formato legible
      fecha: new Date(ahora).toLocaleDateString(),
      horaFormato: new Date(ahora).toLocaleTimeString(),
      estacion: selectedStation,
      linea: selectedLinea,
    };

    try {
      await updateDoc(stationRef, {
        comentarios: arrayUnion(comentario),
        ultimaActualizacion: serverTimestamp(),
        totalReportes: arrayUnion(ahora), // Array de timestamps para estadísticas
      });

      // Verificar si hay muchos reportes recientes
      const estacionCerrada = await checkRecentReports(estacionId);

      if (estacionCerrada) {
        Alert.alert(
          "⚠️ Alerta de Estación",
          `Tu reporte ha sido registrado.\n\n⚠️ Esta estación ha sido marcada como CERRADA debido a la alta cantidad de reportes recientes (5+ en 15 minutos).`,
          [{ text: "Entendido", style: "default" }]
        );
      } else {
        Alert.alert(
          "✅ Reporte Enviado",
          "Tu reporte se ha guardado correctamente y será visible para la comunidad."
        );
      }
      setComment("");
      setSelectedLinea(null);
      setSelectedStation(null);
      router.replace("/(index)");
    } catch (error: any) {
      if (error.code === "not-found") {
        // Documento no existe, así que lo creamos con metadata completa
        await setDoc(stationRef, {
          comentarios: [comentario],
          estacionId: estacionId,
          estacion: selectedStation,
          linea: selectedLinea,
          estadoCerrada: false,
          fechaCreacion: serverTimestamp(),
          ultimaActualizacion: serverTimestamp(),
          totalReportes: [ahora],
        });

        Alert.alert(
          "✅ Reporte Enviado",
          "Tu reporte se ha guardado correctamente y será visible para la comunidad."
        );
        setComment("");
        setSelectedLinea(null);
        setSelectedStation(null);
        router.replace("/(index)");
      } else {
        console.error("Error al guardar comentario:", error);
        Alert.alert("Error", "No se pudo guardar el comentario.");
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete =
    !!selectedLinea && !!selectedStation && comment.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="create-outline" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>Nuevo Reporte</Text>
          <Text style={styles.subtitle}>
            💬 Comparte información en tiempo real
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>COMUNIDAD</Text>
          </View>
        </View>
      </View>

      {/* Línea */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LÍNEA DE METRO</Text>
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
            const bgColor = lineaColors[item] || "#CCCCCC";
            return (
              <TouchableOpacity
                style={[styles.lineItem, { backgroundColor: bgColor }]}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut
                  );
                  setSelectedLinea(item);
                  setShowLineasDropdown(false);
                  setShowEstacionesDropdown(true);
                }}
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

      {/* Estación */}
      {selectedLinea && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ESTACIÓN</Text>
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
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut
                    );
                    setSelectedStation(item);
                    setShowEstacionesDropdown(false);
                  }}
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

      {/* Comentario */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TU MENSAJE</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="¿Qué está pasando en esta estación?"
            placeholderTextColor="#95a5a6"
            value={comment}
            onChangeText={setComment}
            maxLength={200}
            multiline
          />
          <View style={styles.charCounter}>
            <Text
              style={[
                styles.charCountText,
                comment.length > 180 && styles.charCountWarning,
              ]}
            >
              {comment.length}/200
            </Text>
          </View>
        </View>
      </View>

      {/* Botón o loader */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e68059" />
          <Text style={styles.loadingText}>Enviando...</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, !isFormComplete && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormComplete}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.buttonText}>Publicar Reporte</Text>
            <View style={styles.buttonArrow}>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  headerGradient: {
    backgroundColor: "#e68059",
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#e68059",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7f8c8d",
    marginBottom: 8,
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
  inputContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  input: {
    padding: 20,
    textAlignVertical: "top",
    fontSize: 16,
    minHeight: 140,
    color: "#2c3e50",
    lineHeight: 24,
  },
  charCounter: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
  },
  charCountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#95a5a6",
    textAlign: "right",
  },
  charCountWarning: {
    color: "#e67e22",
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#e68059",
  },
  button: {
    backgroundColor: "#e68059",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    paddingVertical: 20,
    borderRadius: 25,
    shadowColor: "#e68059",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: "#bdc3c7",
    shadowColor: "#95a5a6",
    shadowOpacity: 0.2,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 1,
  },
  buttonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
});
