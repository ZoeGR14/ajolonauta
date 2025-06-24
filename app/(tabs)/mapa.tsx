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
    const mensaje =
      estacionesCerradas.length > 0
        ? `\n${estacionesCerradas.map((e) => `🔸 ${e}`).join("\n\n")}`
        : "✅ ¡Todas las estaciones están disponibles!";

    Alert.alert("🚧 Estaciones cerradas", mensaje);
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.infoButton}
          activeOpacity={0.9}
          onPress={openPanel}
        >
          <Feather name="menu" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.infoButton, { marginTop: 12 }]}
          activeOpacity={0.9}
          onPress={InfoEstacion}
        >
          <Feather name="info" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {modal && (
        <Animated.View style={[styles.slidePanel, { left: slideAnim }]}>
          <Text style={styles.panelTitle}>Líneas del Metro</Text>
          <View style={styles.divider} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {lineas.map((line) => (
              <TouchableOpacity
                key={line}
                style={[
                  styles.row,
                  {
                    backgroundColor: checkedItems[line]
                      ? getColorForLine(line)
                      : "#f4f4f4",
                    ...styles.lineItem,
                  },
                ]}
                activeOpacity={0.9}
                onPress={() => toggleCheckbox(line)}
              >
                <Checkbox
                  value={checkedItems[line]}
                  onValueChange={() => toggleCheckbox(line)}
                  color="#E68059"
                />
                <Text style={styles.checkboxText}>{line}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={handleSelectAll}
            >
              <Checkbox
                value={isAllSelected}
                onValueChange={handleSelectAll}
                color="green"
              />
              <Text style={styles.checkboxTextBold}>Seleccionar Todos</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={closePanel}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: "100%" },
  buttonContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoButton: {
    backgroundColor: "#E68059",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  slidePanel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: Dimensions.get("window").width / 2,
    backgroundColor: "#ffffffee",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: -2, height: 0 },
    shadowRadius: 8,
    elevation: 10,
    zIndex: 99,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxText: {
    paddingLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  checkboxTextBold: {
    paddingLeft: 12,
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d6a4f",
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#E68059",
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
    marginBottom: 10,
  },

  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginBottom: 16,
  },

  lineItem: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d2f5dc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
