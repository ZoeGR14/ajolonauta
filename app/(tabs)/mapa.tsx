import Checkbox from "expo-checkbox";
import React, { useCallback, useMemo, useState } from "react";
import {
  Button,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import geojsonData from "../../assets/data/metro.json";
import terminales from "../../assets/data/terminales.json";

export const euclidiana = (
  punto1: { latitude: any; longitude: any },
  punto2: { latitude: any; longitude: any }
) => {
  return Math.sqrt(
    Math.pow(punto1.latitude - punto2.latitude, 2) +
      Math.pow(punto1.longitude - punto2.longitude, 2)
  );
};

export const orderStations = (
  startStation: { latitude: any; longitude: any; nombre?: string },
  stations: any[]
) => {
  let orderedStations = [startStation];
  let remainingStations = stations.filter(
    (station) =>
      station.latitude !== startStation.latitude ||
      station.longitude !== startStation.longitude
  );

  while (remainingStations.length > 0) {
    let lastStation = orderedStations[orderedStations.length - 1];
    let nearestStation = remainingStations.reduce((nearest, station) =>
      euclidiana(lastStation, station) < euclidiana(lastStation, nearest)
        ? station
        : nearest
    );

    orderedStations.push(nearestStation);
    remainingStations = remainingStations.filter(
      (station) => station !== nearestStation
    );
  }

  return orderedStations;
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

export const polylines = lineas
  .map((l) => {
    const completa = geojsonData.features.filter((lines) =>
      lines.properties.routes.includes(l)
    );

    const terminal = terminales.find((t) => t.linea === l)?.nombre;
    let coordenadaInicial = { latitude: 0, longitude: 0 };

    const coordenadas = completa.map((linea) => {
      const [longitude, latitude] = linea.geometry.coordinates;
      if (linea.properties.name === terminal) {
        coordenadaInicial = { latitude, longitude };
      }
      return { latitude, longitude };
    });

    const color = terminales.find((t) => t.linea === l)?.color;

    return {
      startStation: coordenadaInicial,
      stations: coordenadas,
      color,
      linea: l,
    };
  })
  .map((p) => ({
    estaciones: orderStations(p.startStation, p.stations),
    color: p.color,
    linea: p.linea,
  }));

export default function Mapa() {
  const [checkedItems, setCheckedItems] = useState(
    lineas.reduce((acc, line) => ({ ...acc, [line]: false }), {})
  );

  const toggleCheckbox = useCallback((line: string) => {
    //@ts-ignore
    setCheckedItems((prev) => ({ ...prev, [line]: !prev[line] }));
  }, []);

  const [modal, setModal] = useState(false);

  const handleSelectAll = useCallback(() => {
    const areAllSelected = Object.values(checkedItems).every(Boolean);
    setCheckedItems(
      Object.fromEntries(lineas.map((line) => [line, !areAllSelected]))
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
          (line, i) =>
            checkedItems[line] &&
            geojsonData.features
              .filter((l) => l.properties.routes.includes(line))
              .map((a, i2) => (
                <Marker
                  coordinate={{
                    latitude: a.geometry.coordinates[1],
                    longitude: a.geometry.coordinates[0],
                  }}
                  key={`${i}-${i2}`}
                  title={a.properties.name}
                  description={a.properties.routes.join(", ")}
                  pinColor="#FE5508"
                />
              ))
        )}

        {polylines.map(
          (p, index) =>
            checkedItems[p.linea] && (
              <Polyline
                coordinates={p.estaciones}
                key={index}
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
          onPress={() => setModal(true)}
        >
          <Text style={styles.infoText}>?</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={modal}
        animationType="slide"
        onRequestClose={() => setModal(false)}
      >
        <View style={styles.modalContainer}>
          {lineas.map((line) => (
            <View key={line} style={styles.row}>
              <Checkbox
                value={checkedItems[line]}
                onValueChange={() => toggleCheckbox(line)}
                color="midnightblue"
              />
              <Text style={styles.checkboxText}>{line}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Checkbox
              value={isAllSelected}
              onValueChange={handleSelectAll}
              color="green"
            />
            <Text style={styles.checkboxTextBold}>Seleccionar Todos</Text>
          </View>
          <Button title="Cerrar Modal" onPress={() => setModal(false)} />
        </View>
      </Modal>
    </View>
  );
}

// Estilos
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
  infoText: { color: "white", fontWeight: "bold", fontSize: 24 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  row: { flexDirection: "row", alignItems: "center" },
  checkboxText: { paddingLeft: 10 },
  checkboxTextBold: { paddingLeft: 10, fontWeight: "bold" },
});

export const mapStyle = [
  {
    featureType: "poi",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
