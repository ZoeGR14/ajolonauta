import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#e68059",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#fff",
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(index)"
        options={{
          title: "Avisos",
          tabBarIcon: ({ focused }) => (
            <Feather
              name="alert-circle"
              size={focused ? 28 : 24}
              color={focused ? "#e68059" : "#9CA3AF"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: "SOS",
          tabBarIcon: ({ focused }) => (
            <Feather
              name="phone"
              size={focused ? 28 : 24}
              color={focused ? "#e68059" : "#9CA3AF"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: "Mapa",
          tabBarIcon: ({ focused }) => (
            <Feather
              name="map"
              size={focused ? 28 : 24}
              color={focused ? "#e68059" : "#9CA3AF"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="misRutas"
        options={{
          title: "Mis Rutas",
          tabBarIcon: ({ focused }) => (
            <Feather
              name="bookmark"
              size={focused ? 28 : 24}
              color={focused ? "#e68059" : "#9CA3AF"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(perfil)"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <Feather
              name="user"
              size={24}
              color={focused ? "white" : "#e68059"}
              style={{
                backgroundColor: focused ? "#e68059" : "transparent",
                borderRadius: 12,
                padding: 8,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
