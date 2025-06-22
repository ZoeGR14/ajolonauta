import { auth, db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  ToastAndroid,
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

const lineaColors: { [key: string]: string } = {
  "Línea 1": "#f0658f",
  "Línea 2": "#0571b9",
  "Línea 3": "#bcb600",
  "Línea 4": "#81c5b8",
  "Línea 5": "#fae202",
  "Línea 6": "#e61f24",
  "Línea 7": "#eb8519",
  "Línea 8": "#0b9557",
  "Línea 9": "#461e04",
  "Línea A": "#970081",
  "Línea B": "#c5c5c5",
  "Línea 12": "#b4a442",
};

export default function MisRutas() {
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

  const [estacionesCerradas, setEstacionesCerradas] = useState<string[]>([]);
  const [loading1, isLoading1] = useState(true);
  const [loading2, isLoading2] = useState(true);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [modal, setModal] = useState(false);

  const [hideS, setHideS] = useState(false);
  const [hideE, setHideE] = useState(false);

  useEffect(() => {
    if (estacionesCerradas.includes(start)) {
      ToastAndroid.show(`${start} está presentando fallas`, ToastAndroid.SHORT);
    }
  }, [start, estacionesCerradas]);

  useEffect(() => {
    if (estacionesCerradas.includes(end)) {
      ToastAndroid.show(`${end} está presentando fallas`, ToastAndroid.SHORT);
    }
  }, [end, estacionesCerradas]);

  const handleSelectS = (estacion: string) => {
    setStart(estacion);
    setHideS(true);
  };

  const handleSelectE = (estacion: string) => {
    setEnd(estacion);
    setHideE(true);
  };

  const result = dijkstra(grafo, start, end);

  const filteredEstacionesS = start
    ? arregloEstaciones.filter((n) =>
        n?.toLowerCase().includes(start.toLowerCase())
      )
    : [];

  const filteredEstacionesE = end
    ? arregloEstaciones.filter((n) =>
        n?.toLowerCase().includes(end.toLowerCase())
      )
    : [];

  const coordenadas = result?.path.map((s) => ({
    latitude: s.coordenadas.latitude,
    longitude: s.coordenadas.longitude,
  }));

  const [routes, setRoutes] = useState<any>([]);
  const user = auth.currentUser;
  const routesCollection = collection(db, "rutas_guardadas");

  const fetchRoutes = async () => {
    if (user) {
      const q = query(routesCollection, where("userId", "==", user.uid));
      const data = await getDocs(q);
      setRoutes(data.docs.map((doc) => ({ ...doc.data() })));
    } else {
      console.log("Ningun usuario loggeado");
    }
    isLoading2(false);
  };

  const addRoutes = async (start: string, end: string) => {
    if (user) {
      if (
        routes.length > 0 &&
        routes.some(
          (r: { start: string; end: string }) =>
            r.start === start && r.end === end
        )
      ) {
        ToastAndroid.show("Ruta anteriormente guardada", ToastAndroid.SHORT);
      } else {
        isLoading2(true);
        ToastAndroid.show("Guardando ruta...", ToastAndroid.SHORT);
        await addDoc(routesCollection, { start, end, userId: user.uid });
        setRoutes([]);
        fetchRoutes();
      }
    } else {
      console.log("Ningun usuario loggeado");
    }
  };

  useEffect(() => {
    const collectionRef = collection(db, "estaciones_cerradas");
    const q = query(collectionRef);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => doc.id);
      setEstacionesCerradas(data);
      Object.keys(grafo).forEach((estacion) => {
        grafo[estacion].activa = !data.includes(estacion);
      });
      isLoading1(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [user]);

  if (loading1 || loading2) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e68059" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchCard}>
        <Text style={styles.switchText}>Selecciona tus estaciones</Text>
        <Autocomplete
          data={filteredEstacionesS}
          autoCorrect={false}
          onPress={() => {
            setHideE(true);
            setHideS(false);
          }}
          placeholder="Punto de partida"
          placeholderTextColor="#A9A9A9"
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
          inputContainerStyle={styles.inputUber}
          listContainerStyle={styles.list}
          containerStyle={{ marginBottom: 10 }}
        />
        <Autocomplete
          data={filteredEstacionesE}
          placeholder="Destino"
          placeholderTextColor="#A9A9A9"
          autoCorrect={false}
          onPress={() => {
            setHideS(true);
            setHideE(false);
          }}
          defaultValue={end}
          onChangeText={(text) => {
            setEnd(text);
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
          inputContainerStyle={styles.inputUber}
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
          {result?.path.map((r, i) => (
            <Marker
              coordinate={r.coordenadas}
              key={i}
              title={r.nombre}
              description={r.linea}
            />
          ))}
          {coordenadas && coordenadas.length > 0 && (
            <Polyline
              coordinates={coordenadas}
              strokeWidth={5}
              strokeColor="blue"
            />
          )}
        </MapView>

        {coordenadas && coordenadas.length > 0 && (
          <View style={styles.floatingButtons}>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => addRoutes(start, end)}
            >
              <Feather name="save" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.fab} onPress={() => setModal(true)}>
              <Feather name="info" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <Modal
          animationType="slide"
          visible={modal}
          onRequestClose={() => setModal(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Instrucciones de la Ruta</Text>
            <FlatList
              data={result?.path.flatMap((s) => ({
                nombre: s.nombre,
                linea: s.linea,
              }))}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.stepCard}>
                  <View style={styles.stepRow}>
                    <Text style={styles.stepText}>
                      {index + 1}. {item.nombre} - {item.linea}
                    </Text>
                    <View
                      style={[
                        styles.lineDot,
                        { backgroundColor: lineaColors[item.linea] || "#ccc" },
                      ]}
                    />
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => (
                <View style={styles.separator}>
                  <Feather name="arrow-down" size={24} color="#e68059" />
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
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
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#e68059",
    marginBottom: 20,
    textAlign: "center",
  },
  stepCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    marginHorizontal: 4,
  },
  stepText: {
    fontSize: 16,
    color: "#444",
    fontWeight: "500",
  },

  separator: {
    alignItems: "center",
    marginVertical: 6,
    opacity: 0.6,
  },
  closeButton: {
    backgroundColor: "#e68059",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  searchCard: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  inputUber: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  switchText: {
    color: "#666",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  floatingButtons: {
    position: "absolute",
    bottom: 30,
    right: 20,
    flexDirection: "column",
    gap: 15,
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e68059",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
});
