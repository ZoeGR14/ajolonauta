import { auth, db } from "@/FirebaseConfig";
import { router } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
      console.log("Ningun usuario loggeado");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoutes();
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e68059" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <FlatList
        data={routes}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={{
              padding: 10,
              borderWidth: 1,
              borderRadius: 10,
              backgroundColor: "#e68059",
            }}
            key={item.id}
            onPress={() => router.push(`./${item.id}`)}
          >
            <Text>
              {index + 1}. {item.start} -{">"} {item.end}
            </Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => (
          <View
            style={{
              flex: 1,
              padding: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
});
