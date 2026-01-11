import { grafo, lineas, lines, mapStyle, origin } from "@/assets/data/info";
import { db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { useFocusEffect } from "expo-router";
import { collection, onSnapshot, query } from "firebase/firestore";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import geojsonData from "../../assets/data/metro.json";
import terminales from "../../assets/data/terminales.json";

export default function Mapa() {
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

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(
    Object.fromEntries(lineas.map((line) => [line, false]))
  );
  const [estacionesCerradas, setEstacionesCerradas] = useState<string[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [modal, setModal] = useState<boolean>(false);
  const [modalInfo, setModalInfo] = useState<boolean>(false);
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").width)
  ).current;

  const toggleCheckbox = useCallback((line: string) => {
    setCheckedItems((prev) => ({ ...prev, [line]: !prev[line] }));
  }, []);

  const openPanel = () => {
    setModal(true);
    Animated.timing(slideAnim, {
      toValue: Dimensions.get("window").width / 2,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closePanel = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get("window").width,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setModal(false));
  };

  const getColorForLine = (line: string): string => {
    return terminales.find((t) => t.linea === line)?.color || "#f0f0f0";
  };

  const handleSelectAll = useCallback(() => {
    const allSelected = Object.values(checkedItems).every(Boolean);
    setCheckedItems(
      Object.fromEntries(lineas.map((line) => [line, !allSelected]))
    );
  }, [checkedItems]);

  const isAllSelected = useMemo(
    () => Object.values(checkedItems).every(Boolean),
    [checkedItems]
  );

  const selectedCount = useMemo(
    () => Object.values(checkedItems).filter(Boolean).length,
    [checkedItems]
  );

  useEffect(() => {
    const collectionRef = collection(db, "estaciones_cerradas");
    const q = query(collectionRef);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => doc.id);
      setEstacionesCerradas(data);
      Object.keys(grafo).forEach((estacion) => {
        grafo[estacion].activa = !data.includes(estacion);
      });
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const InfoEstacion = () => {
    setModalInfo(true);
  };

  return (
    <View style={styles.container}>
      {/* Header Superior */}
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          <View style={styles.topBarInfo}>
            <Feather name="map" size={24} color="#E68059" />
            <View style={styles.topBarTextContainer}>
              <Text style={styles.topBarTitle}>Mapa del Metro</Text>
              <Text style={styles.topBarSubtitle}>
                {selectedCount > 0 
                  ? `${selectedCount} línea${selectedCount > 1 ? 's' : ''} visible${selectedCount > 1 ? 's' : ''}`
                  : "Selecciona líneas para ver"}
              </Text>
            </View>
          </View>
          <View style={styles.topBarActions}>
            <TouchableOpacity
              style={styles.topBarButton}
              activeOpacity={0.8}
              onPress={InfoEstacion}
            >
              <Feather name="alert-circle" size={20} color="#E68059" />
              {estacionesCerradas.length > 0 && (
                <View style={[styles.miniBadge, styles.badgeDanger]}>
                  <Text style={styles.miniBadgeText}>{estacionesCerradas.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.topBarButton, styles.topBarButtonPrimary]}
              activeOpacity={0.8}
              onPress={openPanel}
            >
              <Feather name="layers" size={20} color="#fff" />
              <Text style={styles.topBarButtonText}>Líneas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <MapView
        style={styles.map}
        initialRegion={origin}
        customMapStyle={mapStyle}
        showsCompass={false}
        toolbarEnabled={false}
        provider="google"
        loadingEnabled={true}
        loadingIndicatorColor="#e68059"
      >
        {lineas.map(
          (line) =>
            checkedItems[line] &&
            geojsonData.features
              .filter((f) => f.properties.routes.includes(line))
              .map((f, i) => (
                <Marker
                  key={`${line}-${i}`}
                  coordinate={{
                    latitude: f.geometry.coordinates[1],
                    longitude: f.geometry.coordinates[0],
                  }}
                  title={f.properties.name}
                  description={f.properties.routes.join(", ")}
                  pinColor="#E68059"
                />
              ))
        )}
        {lines.map(
          (p) =>
            checkedItems[p.linea] && (
              <Polyline
                key={p.linea}
                coordinates={p.estaciones.map((a) => ({
                  latitude: a.latitude,
                  longitude: a.longitude,
                }))}
                strokeWidth={5}
                strokeColor={p.color}
              />
            )
        )}
      </MapView>

      {modal && (
        <Animated.View style={[styles.slidePanel, { left: slideAnim }]}>
          {/* Header del Panel */}
          <View style={styles.panelHeader}>
            <View style={styles.panelIconBg}>
              <Feather name="layers" size={24} color="#fff" />
            </View>
            <Text style={styles.panelTitle}>Líneas del Metro</Text>
            <Text style={styles.panelSubtitle}>Selecciona las líneas a visualizar</Text>
          </View>
          
          <View style={styles.divider} />

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {lineas.map((line) => (
              <TouchableOpacity
                key={line}
                style={[
                  styles.lineItem,
                  {
                    backgroundColor: checkedItems[line]
                      ? getColorForLine(line)
                      : "#F9FAFB",
                    borderColor: checkedItems[line]
                      ? getColorForLine(line)
                      : "#E5E7EB",
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => toggleCheckbox(line)}
              >
                <View style={styles.lineItemContent}>
                  <Checkbox
                    value={checkedItems[line]}
                    onValueChange={() => toggleCheckbox(line)}
                    color={checkedItems[line] ? "#fff" : "#E68059"}
                  />
                  <Text
                    style={[
                      styles.checkboxText,
                      checkedItems[line] && styles.checkboxTextActive,
                    ]}
                  >
                    {line}
                  </Text>
                </View>
                {checkedItems[line] && (
                  <Feather name="check-circle" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={handleSelectAll}
            >
              <View style={styles.selectAllIconBg}>
                <Feather 
                  name={isAllSelected ? "check-square" : "square"} 
                  size={20} 
                  color="#059669" 
                />
              </View>
              <Text style={styles.selectAllText}>
                {isAllSelected ? "Deseleccionar Todos" : "Seleccionar Todos"}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={closePanel}>
            <Feather name="x" size={20} color="#fff" />
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Modal de Estaciones Cerradas */}
      <Modal
        visible={modalInfo}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalInfo(false)}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <View style={styles.infoIconBg}>
                <Feather 
                  name={estacionesCerradas.length > 0 ? "alert-triangle" : "check-circle"} 
                  size={32} 
                  color="#fff" 
                />
              </View>
              <Text style={styles.infoModalTitle}>
                {estacionesCerradas.length > 0 
                  ? "Estaciones Cerradas" 
                  : "Estado del Metro"}
              </Text>
              <Text style={styles.infoModalSubtitle}>
                {estacionesCerradas.length > 0
                  ? `${estacionesCerradas.length} estación${estacionesCerradas.length > 1 ? 'es' : ''} fuera de servicio`
                  : "¡Todas las estaciones disponibles!"}
              </Text>
            </View>

            <ScrollView 
              style={styles.infoModalScroll}
              showsVerticalScrollIndicator={false}
            >
              {estacionesCerradas.length > 0 ? (
                estacionesCerradas.map((estacion, index) => (
                  <View key={index} style={styles.estacionItem}>
                    <View style={styles.estacionIconBg}>
                      <Feather name="x-circle" size={20} color="#DC2626" />
                    </View>
                    <Text style={styles.estacionText}>{estacion}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="check-circle" size={64} color="#10B981" />
                  <Text style={styles.emptyStateText}>
                    Todas las estaciones{"\n"}están operando normalmente
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.infoModalButton} 
              onPress={() => setModalInfo(false)}
            >
              <Text style={styles.infoModalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: "100%" },
  
  /* Top Bar */
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  topBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  topBarInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  topBarTextContainer: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 2,
  },
  topBarSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  topBarActions: {
    flexDirection: "row",
    gap: 8,
  },
  topBarButton: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  topBarButtonPrimary: {
    backgroundColor: "#E68059",
    borderColor: "#E68059",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
  },
  topBarButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  miniBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#10B981",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  miniBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  badgeDanger: {
    backgroundColor: "#DC2626",
  },
  
  /* Panel Lateral */
  slidePanel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: Dimensions.get("window").width / 2,
    backgroundColor: "#fff",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: -4, height: 0 },
    shadowRadius: 12,
    elevation: 15,
    zIndex: 99,
  },
  panelHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  panelIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E68059",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#E68059",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 4,
  },
  panelSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
  },
  divider: {
    height: 2,
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
    borderRadius: 1,
  },
  
  /* Items de Línea */
  lineItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lineItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkboxText: {
    paddingLeft: 12,
    fontSize: 15,
    color: "#374151",
    fontWeight: "700",
  },
  checkboxTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  
  /* Botón Seleccionar Todos */
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectAllIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#059669",
  },
  
  /* Botón Cerrar */
  closeButton: {
    marginTop: 10,
    padding: 14,
    backgroundColor: "#E68059",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#E68059",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 15,
  },
  
  /* Modal de Información */
  infoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  infoModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  infoModalHeader: {
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E68059",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#E68059",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  infoModalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  infoModalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
  },
  infoModalScroll: {
    maxHeight: 300,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  estacionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FEF2F2",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  estacionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  estacionText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  infoModalButton: {
    backgroundColor: "#E68059",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#E68059",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  infoModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
