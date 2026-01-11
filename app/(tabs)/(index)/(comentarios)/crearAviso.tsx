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
} from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";

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

export default function AddComment() {
  const [selectedLinea, setSelectedLinea] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [showLineasDropdown, setShowLineasDropdown] = useState(false);
  const [showEstacionesDropdown, setShowEstacionesDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const getStationsByLine = (lineaId: string) => {
    const linea = lines.find((l) => l.linea === lineaId);
    return linea ? linea.estaciones.map((est) => est.nombre) : [];
  };

  const checkRecentReports = async (estacionId: string) => {
    try {
      const stationRef = doc(db, "estaciones", estacionId);
      const docSnap = await getDoc(stationRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const comentarios = data.comentarios || [];
        const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
        const recentReports = comentarios.filter((comment: any) => {
          return comment.timestamp && comment.timestamp >= fifteenMinutesAgo;
        });

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
        reportesRecientes: recentReports.slice(-10),
        fechaCierre: Date.now(),
        fechaCierreFormato: new Date().toLocaleString(),
        timestampServidor: serverTimestamp(),
      };
      await setDoc(closedStationRef, closedData);
      const stationRef = doc(db, "estaciones", estacionId);
      await updateDoc(stationRef, {
        estadoCerrada: true,
        fechaCierre: Date.now(),
        ultimaActualizacion: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error al marcar estación como cerrada:", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLinea || !selectedStation) {
      Alert.alert("Faltan datos", "Por favor indica dónde te encuentras.");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Campo vacío", "Escribe qué está sucediendo.");
      return;
    }

    const estacionId = `${selectedStation.replace(
      "/",
      "|"
    )} - ${selectedLinea}`;

    setLoading(true);
    const stationRef = doc(db, "estaciones", estacionId);
    const ahora = Date.now();
    const comentario = {
      usuario: auth.currentUser?.displayName || "Anónimo",
      userId: auth.currentUser?.uid || "anonimo",
      texto: comment,
      timestamp: ahora,
      hora: new Date().toLocaleString(),
      fecha: new Date(ahora).toLocaleDateString(),
      horaFormato: new Date(ahora).toLocaleTimeString(),
      estacion: selectedStation,
      linea: selectedLinea,
    };

    try {
      await updateDoc(stationRef, {
        comentarios: arrayUnion(comentario),
        ultimaActualizacion: serverTimestamp(),
        totalReportes: arrayUnion(ahora),
      });

      const estacionCerrada = await checkRecentReports(estacionId);

      if (estacionCerrada) {
        Alert.alert(
          "⚠️ Estación Cerrada",
          `Gracias por avisar. Debido a los múltiples reportes, hemos marcado la estación como CERRADA.`,
          [{ text: "Entendido", onPress: () => router.replace("/(index)") }]
        );
      } else {
        Alert.alert("¡Enviado!", "Gracias por contribuir a la comunidad.", [
          { text: "OK", onPress: () => router.replace("/(index)") },
        ]);
      }
    } catch (error: any) {
      if (error.code === "not-found") {
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
        Alert.alert("¡Enviado!", "Gracias por ser el primero en reportar.", [
          { text: "OK", onPress: () => router.replace("/(index)") },
        ]);
      } else {
        Alert.alert("Error", "No se pudo guardar el reporte.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete =
    !!selectedLinea && !!selectedStation && comment.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#e68059" />

      {/* Header Compacto */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Reporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <Text style={styles.introText}>
          Tu reporte ayuda a miles de usuarios en tiempo real.
        </Text>

        {/* Card: Selección de Ubicación */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. ¿Dónde estás?</Text>

          <View style={styles.row}>
            {/* Selector Línea */}
            <TouchableOpacity
              style={[
                styles.selectorBox,
                selectedLinea
                  ? {
                      borderColor: lineaColors[selectedLinea],
                      backgroundColor: "#fff",
                    }
                  : {},
              ]}
              onPress={() => {
                setShowLineasDropdown(true);
                setShowEstacionesDropdown(false);
              }}
            >
              <Text style={styles.label}>Línea</Text>
              <View style={styles.selectorValueRow}>
                {selectedLinea && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: lineaColors[selectedLinea] },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.selectorValue,
                    !selectedLinea && { color: "#ccc" },
                  ]}
                  numberOfLines={1}
                >
                  {selectedLinea
                    ? selectedLinea.replace("Línea ", "L")
                    : "Seleccionar"}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={16}
                color="#ccc"
                style={styles.chevron}
              />
            </TouchableOpacity>

            {/* Selector Estación */}
            <TouchableOpacity
              style={[
                styles.selectorBox,
                !selectedLinea && { opacity: 0.5, backgroundColor: "#f9f9f9" },
                selectedStation ? { borderColor: "#e68059" } : {},
              ]}
              onPress={() => {
                if (selectedLinea) {
                  setShowEstacionesDropdown(true);
                  setShowLineasDropdown(false);
                }
              }}
              disabled={!selectedLinea}
            >
              <Text style={styles.label}>Estación</Text>
              <View style={styles.selectorValueRow}>
                <Text
                  style={[
                    styles.selectorValue,
                    !selectedStation && { color: "#ccc" },
                  ]}
                  numberOfLines={1}
                >
                  {selectedStation || "Seleccionar"}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={16}
                color="#ccc"
                style={styles.chevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card: Input de Texto */}
        <View style={[styles.sectionCard, { minHeight: 200 }]}>
          <Text style={styles.sectionTitle}>2. ¿Qué está pasando?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Ej: Vagones llenos, retraso de 10 min, andén saturado..."
            placeholderTextColor="#A0A0A0"
            multiline
            numberOfLines={6}
            maxLength={200}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />
          <View style={styles.counterRow}>
            <Text
              style={[
                styles.counterText,
                comment.length > 180 && { color: "orange" },
              ]}
            >
              {comment.length}/200
            </Text>
          </View>
        </View>

        {/* Botón Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!isFormComplete || loading) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormComplete || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitText}>Publicar Reporte</Text>
              <Ionicons name="paper-plane" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* MODALES (Reutilizando diseño limpio) */}
      {(showLineasDropdown || showEstacionesDropdown) && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => {
              setShowLineasDropdown(false);
              setShowEstacionesDropdown(false);
            }}
          />
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>
              {showLineasDropdown
                ? "Selecciona la Línea"
                : "Selecciona la Estación"}
            </Text>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {showLineasDropdown ? (
                <View style={styles.gridContainer}>
                  {lineas.map((l) => (
                    <TouchableOpacity
                      key={l}
                      style={[styles.gridItem, { borderColor: lineaColors[l] }]}
                      onPress={() => {
                        setSelectedLinea(l);
                        setSelectedStation(null);
                        setShowLineasDropdown(false);
                        setShowEstacionesDropdown(true); // Auto-open stations
                      }}
                    >
                      <View
                        style={[
                          styles.colorDotBig,
                          { backgroundColor: lineaColors[l] },
                        ]}
                      />
                      <Text style={styles.gridText}>
                        {l.replace("Línea ", "L")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                getStationsByLine(selectedLinea!).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.listItem}
                    onPress={() => {
                      setSelectedStation(s);
                      setShowEstacionesDropdown(false);
                    }}
                  >
                    <Ionicons name="location-outline" size={20} color="#555" />
                    <Text style={styles.listItemText}>{s}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#e68059",
    paddingTop: Platform.OS === "android" ? 40 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  backButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  scrollContent: { padding: 20 },
  introText: {
    color: "#666",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },

  row: { flexDirection: "row", gap: 15 },
  selectorBox: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    position: "relative",
    height: 70,
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    color: "#999",
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 4,
  },
  selectorValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  selectorValue: { fontSize: 16, fontWeight: "600", color: "#333" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chevron: { position: "absolute", top: 10, right: 10 },

  textArea: {
    fontSize: 16,
    color: "#333",
    minHeight: 100,
    lineHeight: 24,
  },
  counterRow: {
    alignItems: "flex-end",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  counterText: { fontSize: 12, color: "#ccc" },

  submitBtn: {
    backgroundColor: "#e68059",
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#e68059",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 40,
  },
  submitBtnDisabled: { backgroundColor: "#ccc", shadowOpacity: 0 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  /* Modales Estilo Bottom Sheet */
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "60%",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  gridItem: {
    width: "30%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: 5,
  },
  colorDotBig: { width: 16, height: 16, borderRadius: 8, marginBottom: 5 },
  gridText: { fontWeight: "700", color: "#444" },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 12,
  },
  listItemText: { fontSize: 16, color: "#333" },
});
