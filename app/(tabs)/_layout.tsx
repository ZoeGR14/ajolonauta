import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
   return (
      <Tabs
         screenOptions={{
            tabBarActiveTintColor: "#e68059",
            tabBarInactiveTintColor: "#e68059",
            tabBarStyle: {
               backgroundColor: "white",
               height: 70,
               paddingBottom: 10,
               paddingTop: 10,
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
                  <Feather
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
            name="mapa"
            options={{
               title: "Mapa",
               tabBarIcon: ({ focused }) => (
                  <Feather
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
            name="misRutas"
            options={{
               title: "Mis Rutas",
               tabBarIcon: ({ focused }) => (
                  <Feather
                     name="bookmark"
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
            name="(perfil)"
            options={{
               title: "Perfil",
               tabBarIcon: ({ focused }) => (
                  <Feather
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
