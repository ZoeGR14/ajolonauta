import { dijkstra, grafo, lines, mapStyle, origin2 } from "@/assets/data/info";
import { db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

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

export default function MapaGuardado() {
  const { id } = useLocalSearchParams();
  const [estacionesCerradas, setEstacionesCerradas] = useState<string[]>([]);
  const [routes, setRoutes] = useState<any>();
  const [modal, setModal] = useState(false);
  const [result, setResult] = useState<any>();
  const [coordenadas, setCoordenadas] = useState<any>();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const readDoc = async () => {
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

  useEffect(() => {
    if (!routes) return;

    if (estacionesCerradas.includes(routes.start)) {
      ToastAndroid.show(
        `${routes.start} está presentando fallas`,
        ToastAndroid.SHORT
      );
    }
  }, [routes, estacionesCerradas]);

  useEffect(() => {
    if (!routes) return;

    if (estacionesCerradas.includes(routes.end)) {
      ToastAndroid.show(
        `${routes.end} está presentando fallas`,
        ToastAndroid.SHORT
      );
    }
  }, [routes, estacionesCerradas]);

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
  }, [routes, estacionesCerradas]);

  useEffect(() => {
    const collectionRef = collection(db, "estaciones_cerradas");
    const q = query(collectionRef);

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => doc.id);
      setEstacionesCerradas(data);
      Object.keys(grafo).forEach((estacion) => {
        grafo[estacion].activa = !data.includes(estacion);
      });
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e68059" />
      </View>
    );
  }

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
        <View style={styles.floatingButtons}>
          <TouchableOpacity style={styles.fab} onPress={() => setModal(true)}>
            <Feather name="info" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <Modal animationType="slide" visible={modal} onRequestClose={() => setModal(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Instrucciones de la Ruta</Text>
          <FlatList
            data={result?.path.map((s: any) => ({
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
            style={[styles.fab, { alignSelf: "center", marginTop: 20 }]}
            onPress={() => setModal(false)}
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  floatingButtons: {
    position: "absolute",
    bottom: 30,
    right: 20,
    flexDirection: "column",
    gap: 15,
    zIndex: 999,
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
