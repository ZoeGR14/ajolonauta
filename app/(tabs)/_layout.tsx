import Entypo from "@expo/vector-icons/Entypo";
import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "midnightblue",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="avisos"
        options={{
          title: "Avisos",
          tabBarIcon: () => (
            <Entypo name="megaphone" size={20} color="midnightblue" />
          ),
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: "Rutas",
          tabBarIcon: () => (
            <Entypo name="map" size={20} color="midnightblue" />
          ),
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: "SOS",
          tabBarIcon: () => (
            <Entypo name="phone" size={20} color="midnightblue" />
          ),
        }}
      />
      <Tabs.Screen
        name="misRutas"
        options={{
          title: "Mis Rutas",
          tabBarIcon: () => (
            <Entypo name="tag" size={20} color="midnightblue" />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: () => (
            <Entypo name="user" size={20} color="midnightblue" />
          ),
        }}
      />
    </Tabs>
  );
}
