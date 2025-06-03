import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Geojson } from "react-native-maps";

import geojsonData from "../../assets/data/metro.json";

export default function Mapa() {
  const [origin, setOrigin] = useState({
    latitude: 19.435721,
    longitude: -99.13149,
    latitudeDelta: 0.1,
    longitudeDelta: 0.8,
  });

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={origin}
        customMapStyle={mapStyle}
      >
        <Geojson
          geojson={geojsonData}
          strokeColor="blue"
          fillColor="red"
          strokeWidth={2}
        />
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
