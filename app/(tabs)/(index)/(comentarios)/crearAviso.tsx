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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
} from "react-native";

const lineaColors: { [key: string]: string } = {
  /*"Línea 1": "#FFBCD4",
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
  "Línea 12": "#E0C98C",*/
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
          [
            {
              text: "Entendido",
              style: "default",
              onPress: () => {
                setLoading(false);
                setComment("");
                setSelectedLinea(null);
                setSelectedStation(null);
                setTimeout(() => {
                  router.replace("/(index)");
                }, 100);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "✅ Reporte Enviado",
          "Tu reporte se ha guardado correctamente y será visible para la comunidad.",
          [
            {
              text: "OK",
              onPress: () => {
                setLoading(false);
                setComment("");
                setSelectedLinea(null);
                setSelectedStation(null);
                setTimeout(() => {
                  router.replace("/(index)");
                }, 100);
              },
            },
          ]
        );
      }
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
          "Tu reporte se ha guardado correctamente y será visible para la comunidad.",
          [
            {
              text: "OK",
              onPress: () => {
                setLoading(false);
                setComment("");
                setSelectedLinea(null);
                setSelectedStation(null);
                setTimeout(() => {
                  router.replace("/(index)");
                }, 100);
              },
            },
          ]
        );
      } else {
        console.error("Error al guardar comentario:", error);
        setLoading(false);
        Alert.alert("Error", "No se pudo guardar el comentario.");
        return;
      }
    }
  };

  const isFormComplete =
    !!selectedLinea && !!selectedStation && comment.trim().length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header con gradiente */}
      <View style={styles.headerGradient}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Ionicons name="flash" size={14} color="#FFD700" />
            <Text style={styles.headerBadgeText}>EN VIVO</Text>
          </View>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <View style={styles.iconCircleInner}>
              <Ionicons name="megaphone" size={32} color="#fff" />
            </View>
          </View>
          <Text style={styles.title}>¡Comparte tu Reporte!</Text>
          <Text style={styles.subtitle}>
            Tu voz ayuda a toda la comunidad 🚇
          </Text>
        </View>

        {/* Wave decoration */}
        <View style={styles.waveContainer}>
          <View style={styles.wave} />
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressStep,
              selectedLinea && styles.progressStepActive,
            ]}
          >
            <Ionicons
              name={selectedLinea ? "checkmark-circle" : "radio-button-off"}
              size={24}
              color={selectedLinea ? "#4CAF50" : "#bdc3c7"}
            />
          </View>
          <View
            style={[
              styles.progressLine,
              selectedLinea && styles.progressLineActive,
            ]}
          />
          <View
            style={[
              styles.progressStep,
              selectedStation && styles.progressStepActive,
            ]}
          >
            <Ionicons
              name={selectedStation ? "checkmark-circle" : "radio-button-off"}
              size={24}
              color={selectedStation ? "#4CAF50" : "#bdc3c7"}
            />
          </View>
          <View
            style={[
              styles.progressLine,
              comment.trim() && styles.progressLineActive,
            ]}
          />
          <View
            style={[
              styles.progressStep,
              comment.trim() && styles.progressStepActive,
            ]}
          >
            <Ionicons
              name={comment.trim() ? "checkmark-circle" : "radio-button-off"}
              size={24}
              color={comment.trim() ? "#4CAF50" : "#bdc3c7"}
            />
          </View>
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Línea</Text>
          <Text style={styles.progressLabel}>Estación</Text>
          <Text style={styles.progressLabel}>Mensaje</Text>
        </View>
      </View>

      {/* Línea Selection Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrapper}>
            <Ionicons name="train" size={24} color="#e68059" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>Línea de Metro</Text>
            <Text style={styles.cardSubtitle}>Paso 1 de 3</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.selector, selectedLinea && styles.selectorSelected]}
          onPress={() => {
            setShowLineasDropdown(!showLineasDropdown);
            setShowEstacionesDropdown(false);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.selectorContent}>
            <View style={styles.selectorLeft}>
              {selectedLinea ? (
                <View
                  style={[
                    styles.selectedBadge,
                    {
                      backgroundColor: lineaColors[selectedLinea] || "#e68059",
                    },
                  ]}
                >
                  <Ionicons name="subway" size={18} color="#fff" />
                </View>
              ) : (
                <View style={styles.placeholderIcon}>
                  <Ionicons name="help-outline" size={18} color="#95a5a6" />
                </View>
              )}
              <Text
                style={[
                  styles.selectorText,
                  selectedLinea && styles.selectorTextSelected,
                ]}
              >
                {selectedLinea || "Selecciona tu línea"}
              </Text>
            </View>
            <Ionicons
              name={
                showLineasDropdown ? "chevron-up-circle" : "chevron-down-circle"
              }
              size={28}
              color={showLineasDropdown ? "#e68059" : "#bdc3c7"}
            />
          </View>
        </TouchableOpacity>
      </View>

      {showLineasDropdown && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowLineasDropdown(false);
            }}
          />
          <View style={styles.modalCard}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>Selecciona tu línea</Text>
              <TouchableOpacity onPress={() => setShowLineasDropdown(false)}>
                <Ionicons name="close-circle" size={28} color="#95a5a6" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.dropdownScroll}
              showsVerticalScrollIndicator={false}
            >
              {lineas.map((item) => {
                const bgColor = lineaColors[item] || "#CCCCCC";
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.lineItem, { backgroundColor: bgColor }]}
                    onPress={() => {
                      setSelectedLinea(item);
                      setShowLineasDropdown(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.lineContent}>
                      <View style={styles.lineIcon}>
                        <Ionicons name="subway" size={26} color="#fff" />
                      </View>
                      <Text style={styles.lineText}>{item}</Text>
                      <Ionicons
                        name="arrow-forward-circle"
                        size={24}
                        color="rgba(255,255,255,0.9)"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Estación Selection Card */}
      {selectedLinea && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrapper}>
              <Ionicons name="location" size={24} color="#e68059" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Estación</Text>
              <Text style={styles.cardSubtitle}>Paso 2 de 3</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.selector,
              selectedStation && styles.selectorSelected,
            ]}
            onPress={() => {
              setShowEstacionesDropdown(!showEstacionesDropdown);
              setShowLineasDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorLeft}>
                {selectedStation ? (
                  <View
                    style={[
                      styles.selectedBadge,
                      { backgroundColor: "#4CAF50" },
                    ]}
                  >
                    <Ionicons name="pin" size={18} color="#fff" />
                  </View>
                ) : (
                  <View style={styles.placeholderIcon}>
                    <Ionicons name="help-outline" size={18} color="#95a5a6" />
                  </View>
                )}
                <Text
                  style={[
                    styles.selectorText,
                    selectedStation && styles.selectorTextSelected,
                  ]}
                >
                  {selectedStation || "Selecciona tu estación"}
                </Text>
              </View>
              <Ionicons
                name={
                  showEstacionesDropdown
                    ? "chevron-up-circle"
                    : "chevron-down-circle"
                }
                size={28}
                color={showEstacionesDropdown ? "#e68059" : "#bdc3c7"}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {showEstacionesDropdown && selectedLinea && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowEstacionesDropdown(false);
            }}
          />
          <View style={styles.modalCard}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderText}>
                Selecciona tu estación
              </Text>
              <TouchableOpacity
                onPress={() => setShowEstacionesDropdown(false)}
              >
                <Ionicons name="close-circle" size={28} color="#95a5a6" />
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
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.stationContent}>
                    <View style={styles.stationIconWrapper}>
                      <Ionicons
                        name="location-sharp"
                        size={20}
                        color="#e68059"
                      />
                    </View>
                    <Text style={styles.stationText}>{item}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#bdc3c7"
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Message Input Card */}
      {selectedStation && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrapper}>
              <Ionicons name="chatbubbles" size={24} color="#e68059" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Tu Reporte</Text>
              <Text style={styles.cardSubtitle}>
                Paso 3 de 3 - ¿Qué está pasando?
              </Text>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ejemplo: Servicio lento, mucha gente, estación cerrada..."
              placeholderTextColor="#a0a0a0"
              value={comment}
              onChangeText={setComment}
              maxLength={200}
              multiline
              numberOfLines={5}
              scrollEnabled={true}
            />
            <View style={styles.inputFooter}>
              <View style={styles.inputTips}>
                <Ionicons name="bulb" size={14} color="#FFA500" />
                <Text style={styles.inputTipsText}>Sé claro y conciso</Text>
              </View>
              <Text
                style={[
                  styles.charCounter,
                  comment.length > 180 && styles.charCounterWarning,
                  comment.length === 200 && styles.charCounterDanger,
                ]}
              >
                {comment.length}/200
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Submit Button */}
      {!loading && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isFormComplete && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormComplete}
            activeOpacity={0.85}
          >
            <View style={styles.submitButtonContent}>
              <View style={styles.submitButtonIcon}>
                <Ionicons name="paper-plane" size={24} color="#fff" />
              </View>
              <Text style={styles.submitButtonText}>
                {isFormComplete
                  ? "¡Publicar Reporte!"
                  : "Completa todos los campos"}
              </Text>
              {isFormComplete && (
                <View style={styles.submitButtonArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {isFormComplete && (
            <Text style={styles.disclaimer}>
              Tu reporte será visible para toda la comunidad
            </Text>
          )}
        </View>
      )}

      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#e68059" />
          <Text style={styles.loadingText}>Enviando tu reporte...</Text>
          <Text style={styles.loadingSubtext}>Esto solo tomará un momento</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  headerGradient: {
    backgroundColor: "#e68059",
    paddingTop: 45,
    paddingBottom: 20,
    position: "relative",
    overflow: "hidden",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  headerBadgeText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircleInner: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "600",
    textAlign: "center",
  },
  waveContainer: {
    position: "absolute",
    bottom: -2,
    left: 0,
    right: 0,
    height: 30,
  },
  wave: {
    height: 30,
    backgroundColor: "#f5f7fa",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  progressContainer: {
    marginTop: 15,
    paddingHorizontal: 40,
    marginBottom: 8,
  },
  progressBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressStep: {
    width: 24,
    height: 24,
  },
  progressStepActive: {
    transform: [{ scale: 1.1 }],
  },
  progressLine: {
    flex: 1,
    height: 3,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
    borderRadius: 2,
  },
  progressLineActive: {
    backgroundColor: "#4CAF50",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7f8c8d",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff5f2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#2c3e50",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#7f8c8d",
    fontWeight: "600",
  },
  selector: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectorSelected: {
    backgroundColor: "#fff",
    borderColor: "#e68059",
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  placeholderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8e8e8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#95a5a6",
    flex: 1,
  },
  selectorTextSelected: {
    color: "#2c3e50",
    fontWeight: "800",
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
  lineItem: {
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  lineContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  lineIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  lineText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  stationItem: {
    backgroundColor: "#f8f9fa",
    marginVertical: 6,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#e68059",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  stationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  stationIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff5f2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
  },
  inputWrapper: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  input: {
    padding: 18,
    fontSize: 16,
    color: "#2c3e50",
    minHeight: 100,
    maxHeight: 120,
    textAlignVertical: "top",
    fontWeight: "500",
    lineHeight: 24,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
  },
  inputTips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputTipsText: {
    fontSize: 12,
    color: "#FFA500",
    fontWeight: "700",
  },
  charCounter: {
    fontSize: 14,
    fontWeight: "700",
    color: "#95a5a6",
  },
  charCounterWarning: {
    color: "#FFA500",
  },
  charCounterDanger: {
    color: "#e74c3c",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  submitButton: {
    backgroundColor: "#e68059",
    borderRadius: 20,
    paddingVertical: 20,
    shadowColor: "#e68059",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#bdc3c7",
    shadowColor: "#95a5a6",
    shadowOpacity: 0.2,
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  submitButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  submitButtonArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  disclaimer: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "600",
  },
  loadingCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "800",
    color: "#e68059",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "600",
  },
});
