import React, { useState } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

  grafo["Observatorio - Línea 1"].activa = false;
  grafo["Tacubaya - Línea 1"].activa = false;
  grafo["Juanacatlán - Línea 1"].activa = false;

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
        }}
      >
        <Autocomplete
          data={filteredEstacionesS}
          onPress={() => {
            setHideE(true);
            setHideS(false);
          }}
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
              <TouchableOpacity onPress={() => handleSelectS(item)}>
                <Text style={{ padding: 10 }}>{item}</Text>
              </TouchableOpacity>
            ),
            keyboardShouldPersistTaps: "always",
          }}
          containerStyle={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: "55%",
          }}
          inputContainerStyle={styles.input}
          listContainerStyle={styles.list}
        />
        <Autocomplete
          data={filteredEstacionesE}
          placeholder="Estación de Destino"
          onPress={() => {
            setHideS(true);
            setHideE(false);
          }}
          defaultValue={end}
          onChangeText={(t) => {
            setEnd(t);
            setHideE(false);
          }}
          hideResults={hideE}
          flatListProps={{
            keyExtractor: (_, idx) => idx.toString(),
            renderItem: ({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  handleSelectE(item);
                  Keyboard.dismiss();
                }}
              >
                <Text style={{ padding: 10 }}>{item}</Text>
              </TouchableOpacity>
            ),
            keyboardShouldPersistTaps: "always",
          }}
          //Estilo del contenedor (es como si estuviera dentro de un view)
          containerStyle={{
            position: "absolute",
            left: 20,
            right: 20,
            top: "55%",
          }}
          //Estilo del InputText
          inputContainerStyle={styles.input}
          //Estilo del contenedor de la lista
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
          provider="google"
          loadingEnabled={true}
          loadingIndicatorColor="#e68059"
        >
          {lines.map((p, index) => (
            <Polyline
              coordinates={p.estaciones}
              key={index}
              strokeWidth={5}
              strokeColor={p.color}
            />
          ))}
          {result?.path.map((r, i) => {
            return (
              <Marker
                coordinate={r.coordenadas}
                key={i}
                title={r.nombre}
                description={r.linea}
              />
            );
          })}
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
    justifyContent: "center",
  },
  input: {
    borderColor: "#e68059",
    borderWidth: 1,
    padding: 5,
    borderRadius: 5,
  },
  list: {
    zIndex: 1,
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: 300,
  },
});
