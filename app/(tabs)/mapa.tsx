import { Feather } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Button,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { lineas, lines, mapStyle, origin } from "@/assets/data/info";
import { useFocusEffect } from "expo-router";
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
        return true; // Previene el comportamiento por defecto
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

  const toggleCheckbox = useCallback((line: string) => {
    setCheckedItems((prev) => ({ ...prev, [line]: !prev[line] }));
  }, []);

  const [modal, setModal] = useState<boolean>(false);
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").width)
  ).current;

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
    return terminales.find((t) => t.linea === line)?.color || "transparent";
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
      </View>

      {modal && (
        <Animated.View style={[styles.slidePanel, { left: slideAnim }]}>
          {lineas.map((line) => (
            <TouchableOpacity
              key={line}
              style={[
                styles.row,
                checkedItems[line] && {
                  backgroundColor: getColorForLine(line),
                  borderRadius: 8,
                  paddingHorizontal: 10,
                },
              ]}
              activeOpacity={0.8}
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
          <TouchableOpacity style={styles.row} onPress={handleSelectAll}>
            <Checkbox
              value={isAllSelected}
              onValueChange={handleSelectAll}
              color="green"
            />
            <Text style={styles.checkboxTextBold}>Seleccionar Todos</Text>
          </TouchableOpacity>
          <Button title="Cerrar" onPress={closePanel} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    position: "absolute",
    top: 20,
    right: 20,
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
    backgroundColor: "white",
    paddingTop: 50,
    padding: 20,
    elevation: 10,
    zIndex: 99,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 8,
  },
  checkboxText: {
    paddingLeft: 10,
  },
  checkboxTextBold: {
    paddingLeft: 10,
    backgroundColor: "transparent",
    fontWeight: "bold",
  },
});
