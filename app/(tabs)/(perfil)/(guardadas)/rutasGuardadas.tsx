import { auth, db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
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
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs;
        setRoutes(data.map((doc) => ({ ...doc.data(), id: doc.id })));
        setLoading(false);
      });
      return unsubscribe;
    } else {
      console.log("Ningun usuario loggeado");
    }
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
          onPress: async () => {
            setLoading(true);
            const routeDoc = doc(db, "rutas_guardadas", id);
            await deleteDoc(routeDoc);
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
      {routes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="trash-2" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No tienes rutas guardadas</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.routeCard}
              onPress={() => router.push(`./${item.id}`)}
              activeOpacity={0.85}
              onLongPress={() => handleLongPress(item.id)}
            >
              <View style={styles.routeHeader}>
                <Feather name="map" size={20} color="#E68059" />
                <Text style={styles.routeTitle}>Ruta #{index + 1}</Text>
              </View>
              <View style={styles.routeDetails}>
                <Feather name="arrow-right" size={16} color="#888" />
                <Text style={styles.routeText}>
                  {item.start} ➔ {item.end}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
        />
      )}
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
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  routeCard: {
    backgroundColor: "#fff",
    padding: 16,
    margin: 10,
    marginVertical: 8,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },

  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },

  routeTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#444",
  },

  routeDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  routeText: {
    fontSize: 16,
    color: "#666",
    flexShrink: 1,
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
});
