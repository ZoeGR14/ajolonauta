import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Autocomplete from "react-native-autocomplete-input";
import MapView, { Marker, Polyline } from "react-native-maps";
import {
  arregloEstaciones,
  dijkstra,
  grafo,
  lines,
  mapStyle,
  origin2,
} from "../../assets/data/info";

export default function MisRutas() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [hideS, setHideS] = useState(false);
  const [hideE, setHideE] = useState(false);

  const handleSelectS = (estacion: string) => {
    setStart(estacion);
    setHideS(true); // Oculta la lista de resultados
  };

  const handleSelectE = (estacion: string) => {
    setEnd(estacion);
    setHideE(true); // Oculta la lista de resultados
  };

  const result = dijkstra(grafo, start, end);

  const filteredEstacionesS = start
    ? arregloEstaciones.filter((n) => n?.includes(start))
    : [];

  const filteredEstacionesE = end
    ? arregloEstaciones.filter((n) => n?.includes(end))
    : [];

  const coordenadas = result?.path.map((s) => ({
    latitude: s.coordenadas.latitude,
    longitude: s.coordenadas.longitude,
  }));

  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
          backgroundColor: "white",
          justifyContent: "center",
          gap: 10,
          paddingHorizontal: 20,
          paddingTop: 20,
        }}
      >
        <Autocomplete
          data={filteredEstacionesS}
          placeholder="Estación de Origen"
          defaultValue={start}
          onChangeText={(text) => {
            setStart(text);
            setHideS(false);
          }}
          hideResults={hideS}
          flatListProps={{
            keyExtractor: (_, idx) => idx.toString(),
            renderItem: ({ item }) => (
              //@ts-ignore
              <TouchableOpacity onPress={() => handleSelectS(item)}>
                <Text style={{ padding: 10 }}>{item}</Text>
              </TouchableOpacity>
            ),
          }}
          inputContainerStyle={styles.input}
          listContainerStyle={styles.list}
        />
        <Autocomplete
          data={filteredEstacionesE}
          placeholder="Estación de Destino"
          defaultValue={end}
          onChangeText={(t) => {
            setEnd(t);
            setHideE(false);
          }}
          hideResults={hideE}
          flatListProps={{
            keyExtractor: (_, idx) => idx.toString(),
            renderItem: ({ item }) => (
              //@ts-ignore
              <TouchableOpacity onPress={() => handleSelectE(item)}>
                <Text style={{ padding: 10 }}>{item}</Text>
              </TouchableOpacity>
            ),
          }}
          inputContainerStyle={styles.input}
          listContainerStyle={styles.list}
        />
      </View>

      <View style={{ flex: 4 }}>
        <MapView
          style={{ width: "100%", height: "100%" }}
          initialRegion={origin2}
          customMapStyle={mapStyle}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {lines.map((p, index) => (
            <Polyline
              coordinates={p.estaciones}
              key={index}
              strokeWidth={5}
              strokeColor={p.color}
            />
          ))}
          {result?.path.map((r, i) => (
            <Marker coordinate={r.coordenadas} key={i} title={r.nombre} />
          ))}
          {coordenadas && coordenadas.length > 0 && (
            <Polyline
              coordinates={coordenadas}
              strokeWidth={5}
              strokeColor="blue"
            />
          )}
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: { borderColor: "black", borderWidth: 1 },
  list: { zIndex: 1 },
});
