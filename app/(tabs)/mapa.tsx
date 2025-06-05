import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import MapView, { Geojson, Polyline } from "react-native-maps";

import geojsonData from "../../assets/data/metro.json";
import terminales from "../../assets/data/terminales.json";

const euclidiana = (
  punto1: { latitude: any; longitude: any },
  punto2: { latitude: any; longitude: any }
) => {
  return Math.sqrt(
    Math.pow(punto1.latitude - punto2.latitude, 2) +
      Math.pow(punto1.longitude - punto2.longitude, 2)
  );
};

const orderStations = (
  startStation: { latitude: any; longitude: any },
  stations: { latitude: any; longitude: any }[]
) => {
  let orderedStations = [startStation];
  let remainingStations = [...stations];

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

export default function Mapa() {
  const origin = {
    latitude: 19.435721,
    longitude: -99.13149,
    latitudeDelta: 0.1,
    longitudeDelta: 0.8,
  };

  let lineas = [
    "Línea 6",
    "Línea 7",
    "Línea 1",
    "Línea 2",
    "Línea 3",
    "Línea 4",
    "Línea 5",
    "Línea 8",
    "Línea 9",
    "Línea A",
    "Línea B",
    "Línea 12",
  ];

  const puntos = lineas.map((l) => {
    const completa = geojsonData.features.filter((lines) =>
      lines.properties.routes.includes(l)
    );

    const terminal = terminales.find((t) => t.linea === l)?.nombre;
    let coordenadaInicial = { latitude: 0, longitude: 0 };

    const coordenadas = completa.map((linea) => {
      if (linea.properties.name === terminal) {
        coordenadaInicial.latitude = linea.geometry.coordinates[1];
        coordenadaInicial.longitude = linea.geometry.coordinates[0];
      }
      return {
        latitude: linea.geometry.coordinates[1],
        longitude: linea.geometry.coordinates[0],
      };
    });

    const color = terminales.find((t) => t.linea === l)?.color;

    return { startStation: coordenadaInicial, stations: coordenadas, color };
  });

  const polylines = puntos.map((p) => ({
    estaciones: orderStations(p.startStation, p.stations),
    color: p.color,
  }));

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={origin}
        customMapStyle={mapStyle}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {lineas.map((num, index) => (
          <Geojson
            geojson={{
              type: "FeatureCollection",
              //@ts-ignore
              features: geojsonData.features.filter((line) =>
                line.properties.routes.includes(num)
              ),
            }}
            color="#fa4c25"
            onPress={(linea) =>
              Alert.alert(
                linea.feature.properties?.routes.join(", "),
                linea.feature.properties?.name
              )
            }
            key={index}
          />
        ))}

        {polylines.map((p, index) => (
          <Polyline
            coordinates={p.estaciones}
            key={index}
            strokeWidth={5}
            strokeColor={p.color}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

const mapStyle = [
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
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "transit",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
];
