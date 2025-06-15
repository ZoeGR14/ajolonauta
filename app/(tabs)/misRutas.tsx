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
  Button,
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
        return true; // Previene el comportamiento por defecto
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
    //Toasts en caso de que las estaciones esten fallando
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
    setHideS(true); // Oculta la lista de resultados
  };

  const handleSelectE = (estacion: string) => {
    setEnd(estacion);
    setHideE(true); // Oculta la lista de resultados
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

  //Firestore

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
      <View
        style={{
          flex: 1,
          backgroundColor: "white",
          justifyContent: "center",
        }}
      >
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
              onPress={() => addRoutes(start, end)}
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
