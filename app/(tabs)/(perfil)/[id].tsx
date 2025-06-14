import { dijkstra, grafo, lines, mapStyle, origin2 } from "@/assets/data/info";
import { db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

export default function MapaGuardado() {
  const { id } = useLocalSearchParams();

  const [estacionesCerradas, setEstacionesCerradas] = useState<string[]>([]);
  const [routes, setRoutes] = useState<any>();
  const [modal, setModal] = useState(false);
  const [result, setResult] = useState<any>();
  const [coordenadas, setCoordenadas] = useState<any>();

  // Obtener el documento de Firestore
  useEffect(() => {
    const readDoc = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, "rutas_guardadas", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRoutes(docSnap.data());
        } else {
          console.log("No se encontró la ruta con el ID:", id);
        }
      } catch (error) {
        console.error("Error al obtener el documento:", error);
      }
    };

    readDoc();
  }, [id]);

  // Calcular la ruta una vez que `routes` tiene datos
  useEffect(() => {
    if (!routes) return;

    const calculatedResult = dijkstra(grafo, routes.start, routes.end);
    setResult(calculatedResult);

    if (calculatedResult?.path) {
      setCoordenadas(
        calculatedResult.path.map((s: any) => ({
          latitude: s.coordenadas.latitude,
          longitude: s.coordenadas.longitude,
        }))
      );
    }
  }, [routes]);

  // Obtener estaciones cerradas y actualizar el grafo
  useEffect(() => {
    const collectionRef = collection(db, "estaciones_cerradas");
    const q = query(collectionRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setEstacionesCerradas(querySnapshot.docs.map((doc) => doc.id));
      Object.keys(grafo).forEach((estacion) => {
        grafo[estacion].activa = !estacionesCerradas.includes(estacion);
      });
    });
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
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

        {result?.path.map((r: any, i: number) => (
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
        <View style={{ position: "absolute", bottom: 20, right: 20, gap: 20 }}>
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
            data={result?.path.flatMap((s: any) => ({
              nombre: s.nombre,
              linea: s.linea,
            }))}
            renderItem={({ item, index }) => (
              <View
                style={{ padding: 10, borderWidth: 1, borderRadius: 10 }}
                key={index}
              >
                <Text>
                  {index + 1}. {item.nombre} - {item.linea}
                </Text>
              </View>
            )}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
