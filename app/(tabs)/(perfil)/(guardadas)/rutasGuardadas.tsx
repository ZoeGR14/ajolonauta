import { auth, db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RutasGuardadas() {
  const [isLoading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<any>([]);
  const user = auth.currentUser;
  const routesCollection = collection(db, "rutas_guardadas");

  const fetchRoutes = async () => {
    if (user) {
      const q = query(routesCollection, where("userId", "==", user.uid));
      const data = await getDocs(q);
      setRoutes(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } else {
      console.log("Ningún usuario loggeado");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoutes();
  }, [user]);

  const handleLongPress = (id: string) => {
    Alert.alert(
      "¿Quieres borrar esta ruta?",
      "Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: () => {
            // Aquí va la lógica para eliminar el documento de Firestore
            console.log("Eliminando ruta con ID:", id);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e68059" />
        <Text style={styles.loadingText}>Cargando rutas guardadas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tus Rutas Guardadas</Text>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.routeCard}
            onPress={() => router.push(`./${item.id}`)}
            activeOpacity={0.8}
          >
            <View style={styles.routeRow}>
              <Feather name="map-pin" size={20} color="#e68059" />
              <Text style={styles.routeText}>
                {index + 1}. {item.start} ➔ {item.end}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: "#f8f8f8",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  routeCard: {
    backgroundColor: "#fff",
    padding: 15,
    margin: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 5,
    elevation: 4,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeText: {
    fontSize: 16,
    color: "#333",
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
});
