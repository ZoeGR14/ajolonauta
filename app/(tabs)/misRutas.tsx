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
  "Línea 1": "#FFBCD4",
  "Línea 2": "#AFE3FF",
  "Línea 3": "#E2DCB4",
  "Línea 4": "#AACBC5",
  "Línea 5": "#FFE15B",
  "Línea 6": "#FFACAC",
  "Línea 7": "#FFDECA",
  "Línea 8": "#A4D6C2",
  "Línea 9": "#A78474",
  "Línea A": "#C790C6",
  "Línea B": "#D9D9D9",
  "Línea 12": "#E0C98C",
};

export default function MisRutas() {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert("¿Salir de la app?", "¿Estás segura/o de que quieres salir?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
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
    ? arregloEstaciones.filter((n) => n?.toLowerCase().includes(start.toLowerCase()))
    : [];

  const filteredEstacionesE = end
    ? arregloEstaciones.filter((n) => n?.toLowerCase().includes(end.toLowerCase()))
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
        routes.some((r: { start: string; end: string }) => r.start === start && r.end === end)
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
      <View style={{ flex: 1, backgroundColor: "white", justifyContent: "center" }}>
        <Autocomplete
          data={filteredEstacionesS}
          autoCorrect={false}
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
          containerStyle={{ position: "absolute", left: 20, right: 20, bottom: "55%" }}
          inputContainerStyle={styles.input}
          listContainerStyle={styles.list}
        />
        <Autocomplete
          data={filteredEstacionesE}
          placeholder="Estación de Destino"
          autoCorrect={false}
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
              <TouchableOpacity onPress={() => { handleSelectE(item); Keyboard.dismiss(); }}>
                <Text style={{ padding: 10 }}>{item}</Text>
              </TouchableOpacity>
            ),
            keyboardShouldPersistTaps: "always",
          }}
          containerStyle={{ position: "absolute", left: 20, right: 20, top: "55%" }}
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
          provider="google"
          loadingEnabled={true}
          loadingIndicatorColor="#e68059"
        >
          {lines.map((p, index) => (
            <Polyline coordinates={p.estaciones} key={index} strokeWidth={5} strokeColor={p.color} />
          ))}
          {result?.path.map((r, i) => (
            <Marker coordinate={r.coordenadas} key={i} title={r.nombre} description={r.linea} />
          ))}
          {coordenadas && coordenadas.length > 0 && (
            <Polyline coordinates={coordenadas} strokeWidth={5} strokeColor="blue" />
          )}
        </MapView>

        {coordenadas && coordenadas.length > 0 && (
          <View style={{ position: "absolute", bottom: 20, right: 20, gap: 20 }}>
            <TouchableOpacity
              style={{ backgroundColor: "#e68059", padding: 15, borderRadius: 12 }}
              activeOpacity={0.9}
              onPress={() => addRoutes(start, end)}
            >
              <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ backgroundColor: "#e68059", padding: 15, borderRadius: 12 }}
              activeOpacity={0.9}
              onPress={() => setModal(true)}
            >
              <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Información</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal animationType="slide" visible={modal} onRequestClose={() => setModal(false)}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Instrucciones de la Ruta</Text>
            <FlatList
              data={result?.path.flatMap((s) => ({ nombre: s.nombre, linea: s.linea }))}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.stepCard,
                    { backgroundColor: lineaColors[item.linea] || "#f5f5f5" },
                  ]}
                >
                  <Text style={styles.stepText}>
                    {index + 1}. {item.nombre} - {item.linea}
                  </Text>
                </View>
              )}
              ItemSeparatorComponent={() => (
                <View style={styles.separator}>
                  <Feather name="arrow-down" size={24} color="#e68059" />
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModal(false)}>
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
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  stepText: {
    fontSize: 16,
    color: "#333",
  },
  separator: {
    alignItems: "center",
    marginVertical: 10,
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
});
