import { db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Button,
  FlatList,
  Keyboard,
  Modal,
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
  lineas,
  lines,
  mapStyle,
  origin2,
} from "../../assets/data/info";

export default function MisRutas() {
  const [estacionesCerradas, setEstacionesCerradas] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribes = lineas.map((linea) => {
      const stationsRef = collection(db, "lineas", linea, "estaciones");
      const q = query(stationsRef, where("activa", "==", false));

      return onSnapshot(q, (querySnapshot) => {
        setEstacionesCerradas((prev) => {
          const nuevasEstaciones = querySnapshot.docs.map(
            (doc) => `${doc.id} - ${linea}`
          );

          const estacionesActualizadas = [
            ...prev.filter((e) => !e.includes(`- ${linea}`)),
            ...nuevasEstaciones,
          ];

          Object.keys(grafo).forEach((estacion) => {
            grafo[estacion].activa = !estacionesActualizadas.includes(estacion);
          });
          return estacionesActualizadas;
        });
      });
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [modal, setModal] = useState(false);

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
        {coordenadas && coordenadas.length > 0 && (
          <View
            style={{
              position: "absolute",
              bottom: 20,
              right: 20,
              gap: 20,
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "#e68059",
                padding: 15,
                borderRadius: 12,
              }}
              activeOpacity={0.9}
              //onPress={} -> Guardar en el perfil de la persona
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Guardar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "#e68059",
                padding: 15,
                borderRadius: 12,
              }}
              activeOpacity={0.9}
              onPress={() => setModal(true)}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Información
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <Modal
          animationType="slide"
          visible={modal}
          onRequestClose={() => setModal(false)}
        >
          <View
            style={{ flex: 1, justifyContent: "center", padding: 15, gap: 10 }}
          >
            <FlatList
              data={result?.path.flatMap((s) => ({
                nombre: s.nombre,
                linea: s.linea,
              }))}
              renderItem={({ item, index }) => {
                return (
                  <View
                    style={{
                      padding: 10,
                      borderWidth: 1,
                      borderRadius: 10,
                    }}
                    key={index}
                  >
                    <Text>
                      {index + 1}. {item.nombre} - {item.linea}
                    </Text>
                  </View>
                );
              }}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    flex: 1,
                    padding: 5,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Feather name="arrow-down" size={28} color="black" />
                </View>
              )}
            />
            <Button title="Cerrar" onPress={() => setModal(false)} />
          </View>
        </Modal>
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
