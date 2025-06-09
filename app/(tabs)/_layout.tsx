import Entypo from "@expo/vector-icons/Entypo";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "midnightblue",       // texto cuando está activa
        tabBarInactiveTintColor: "midnightblue",
        tabBarStyle: {
          backgroundColor: "white",
          height: 70,
          paddingBottom: 10,
          paddingTop: 10
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="avisos"
        options={{
          title: "Avisos",
          tabBarIcon: ({ focused }) => (
            <Entypo
              name="megaphone"
              size={20}
              color={focused ? "white" : "#e68059"}
              style={{
                backgroundColor: focused ? "#e68059" : "transparent",
                borderRadius: 10,
                padding: 4,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: "Rutas",
          tabBarIcon: ({ focused }) => (
            <Entypo
              name="map"
              size={20}
              color={focused ? "white" : "#e68059"}
              style={{
                backgroundColor: focused ? "#e68059" : "transparent",
                borderRadius: 10,
                padding: 4,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: "SOS",
          tabBarIcon: ({ focused }) => (
            <Entypo
              name="phone"
              size={20}
              color={focused ? "white" : "#e68059"}
              style={{
                backgroundColor: focused ? "#e68059" : "transparent",
                borderRadius: 10,
                padding: 4,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="misRutas"
        options={{
          title: "Mis Rutas",
          tabBarIcon: ({ focused }) => (
            <Entypo
              name="tag"
              size={20}
              color={focused ? "white" : "#e68059"}
              style={{
                backgroundColor: focused ? "#e68059" : "transparent",
                borderRadius: 10,
                padding: 4,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <Entypo
              name="user"
              size={20}
              color={focused ? "white" : "#e68059"}
              style={{
                backgroundColor: focused ? "#e68059" : "transparent",
                borderRadius: 10,
                padding: 4,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
