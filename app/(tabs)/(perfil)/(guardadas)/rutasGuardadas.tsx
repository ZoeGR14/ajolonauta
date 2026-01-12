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
      {/* Header Mejorado */}
      <View style={styles.header}>
        <View style={styles.headerIconBg}>
          <Feather name="bookmark" size={28} color="#fff" />
        </View>
        <Text style={styles.title}>Tus Rutas Guardadas</Text>
        <Text style={styles.subtitle}>
          {routes.length}{" "}
          {routes.length === 1 ? "ruta guardada" : "rutas guardadas"}
        </Text>
      </View>

      {routes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Feather name="bookmark" size={50} color="#e68059" />
          </View>
          <Text style={styles.emptyTitle}>No tienes rutas guardadas</Text>
          <Text style={styles.emptyText}>
            Guarda tus rutas favoritas para acceder rápidamente a ellas
          </Text>
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
              <View style={styles.routeCardHeader}>
                <View style={styles.routeNumberBadge}>
                  <Text style={styles.routeNumber}>{index + 1}</Text>
                </View>
                <View style={styles.routeCardHeaderText}>
                  <Text style={styles.routeTitle}>Ruta #{index + 1}</Text>
                  <Text style={styles.routeSubtitle}>
                    {item.path
                      ? `${item.path.length} estaciones`
                      : "Toca para ver detalles"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={24} color="#e68059" />
              </View>

              <View style={styles.divider} />

              <View style={styles.routeDetails}>
                <View style={styles.routePoint}>
                  <View style={styles.startDot} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {item.start}
                  </Text>
                </View>
                <Feather name="arrow-down" size={20} color="#6B7280" />
                <View style={styles.routePoint}>
                  <View style={styles.endDot} />
                  <Text style={styles.routeText} numberOfLines={1}>
                    {item.end}
                  </Text>
                </View>
              </View>

              <View style={styles.routeFooter}>
                <Feather name="info" size={14} color="#9CA3AF" />
                <Text style={styles.routeHint}>
                  Mantén presionado para eliminar
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#e68059",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  routeCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#e68059",
  },
  routeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  routeNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e68059",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
  },
  routeCardHeaderText: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  routeSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
  },
  routeDetails: {
    gap: 12,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  startDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },
  endDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  routeText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
    flex: 1,
  },
  routeFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  routeHint: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
  },
});
