import { Feather } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Button,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import geojsonData from "../../assets/data/metro.json";
import terminales from "../../assets/data/terminales.json";

// Tipos
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Station extends Coordinate {
  nombre?: string;
}

// Utilidades
export const euclidiana = (p1: Coordinate, p2: Coordinate): number =>
  Math.sqrt(
    Math.pow(p1.latitude - p2.latitude, 2) +
      Math.pow(p1.longitude - p2.longitude, 2)
  );

export const orderStations = (startStation: Station, stations: Station[]) => {
  let ordered = [startStation];
  let remaining = stations.filter(
    (s) =>
      s.latitude !== startStation.latitude ||
      s.longitude !== startStation.longitude
  );

  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    const nearest = remaining.reduce((closest, s) =>
      euclidiana(last, s) < euclidiana(last, closest) ? s : closest
    );
    ordered.push(nearest);
    remaining = remaining.filter((s) => s !== nearest);
  }

  return ordered;
};

export const origin = {
  latitude: 19.435721,
  longitude: -99.13149,
  latitudeDelta: 0.1,
  longitudeDelta: 0.8,
};

export const lineas = [
  "Línea 1",
  "Línea 2",
  "Línea 3",
  "Línea 4",
  "Línea 5",
  "Línea 6",
  "Línea 7",
  "Línea 8",
  "Línea 9",
  "Línea A",
  "Línea B",
  "Línea 12",
];

export const polylines = lineas.map((linea) => {
  const features = geojsonData.features.filter((f) =>
    f.properties.routes.includes(linea)
  );

  const terminal = terminales.find((t) => t.linea === linea)?.nombre;
  let initial: Coordinate = { latitude: 0, longitude: 0 };

  const coords: Station[] = features.map((f) => {
    const [lon, lat] = f.geometry.coordinates;
    if (f.properties.name === terminal) {
      initial = { latitude: lat, longitude: lon };
    }
    return { latitude: lat, longitude: lon, nombre: f.properties.name };
  });

  const color = terminales.find((t) => t.linea === linea)?.color || "black";

  return {
    estaciones: orderStations(initial, coords),
    color,
    linea,
  };
});

export default function Mapa() {
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
                  pinColor="#000dc9"
                />
              ))
        )}

        {polylines.map(
          (p, index) =>
            checkedItems[p.linea] && (
              <Polyline
                key={p.linea}
                coordinates={p.estaciones}
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
                color="midnightblue"
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
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: "100%" },
  buttonContainer: { position: "absolute", top: 20, right: 20 },
  infoButton: {
    backgroundColor: "midnightblue",
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
  checkboxText: { paddingLeft: 10 },
  checkboxTextBold: { paddingLeft: 10, fontWeight: "bold" },
});

export const mapStyle = [
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
