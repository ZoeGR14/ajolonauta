import { dijkstra, grafo, lines, mapStyle, origin2 } from "@/assets/data/info";
import { db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
   ActivityIndicator,
   Alert,
   FlatList,
   Modal,
   StyleSheet,
   Text,
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
   const [estacionesCerradas, setEstacionesCerradas] = useState<
      { id: string; razon: string }[]
   >([]);
   const [routes, setRoutes] = useState<any>();
   const [modal, setModal] = useState(false);
   const [result, setResult] = useState<any>();
   const [coordenadas, setCoordenadas] = useState<any>();
   const [rutaAlternativa, setRutaAlternativa] = useState<any>(null);
   const [coordenadasAlternativas, setCoordenadasAlternativas] =
      useState<any>(null);
   const [mensajeRutas, setMensajeRutas] = useState("");
   const [
      hayEstacionesCerradasDefinitivamente,
      setHayEstacionesCerradasDefinitivamente,
   ] = useState(false);
   const [isLoading, setLoading] = useState(true);
   const [isLoading2, setLoading2] = useState(true);
   const [isLoading3, setLoading3] = useState(true);
   const [alertaMostrada, setAlertaMostrada] = useState(false);

   useEffect(() => {
      const readDoc = async () => {
         try {
            const docRef = doc(db, "rutas_guardadas", id as string);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
               setRoutes(docSnap.data());
               setLoading2(false);
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

      const estacionCerrada = estacionesCerradas.find(
         (e) => e.id === routes.start
      );
      if (
         estacionCerrada &&
         estacionCerrada.razon !== "Alta actividad de reportes"
      ) {
         Alert.alert(
            `${routes.start} `,
            `Estación cerrada o con fallas, sin rutas por desplegar`,
            [
               {
                  text: "OK",
                  onPress: () => router.back(),
               },
            ]
         );
      }
   }, [routes, estacionesCerradas]);

   useEffect(() => {
      if (!routes) return;

      const estacionCerrada = estacionesCerradas.find(
         (e) => e.id === routes.end
      );
      if (
         estacionCerrada &&
         estacionCerrada.razon !== "Alta actividad de reportes"
      ) {
         Alert.alert(
            `${routes.end} `,
            `Estación cerrada o con fallas, sin rutas por desplegar`,
            [
               {
                  text: "OK",
                  onPress: () => router.back(),
               },
            ]
         );
      }
   }, [routes, estacionesCerradas]);

   useEffect(() => {
      if (!routes) return;

      // PASO 1: Habilitar TODAS las estaciones temporalmente (ignorar cierres)
      const estacionesOriginalesDeshabilitadas: string[] = [];
      Object.keys(grafo).forEach((estacion) => {
         if (!grafo[estacion].activa) {
            estacionesOriginalesDeshabilitadas.push(estacion);
            grafo[estacion].activa = true;
         }
      });

      // PASO 2: Calcular la ruta MÁS CORTA sin restricciones
      const rutaOptima = dijkstra(grafo, routes.start, routes.end);

      // PASO 3: Verificar si la ruta óptima contiene estaciones cerradas
      const estacionesConAltaDemanda = rutaOptima.path.filter(
         (estacion: any) => {
            const estacionId = `${estacion.nombre} - ${estacion.linea}`;
            const estacionCerrada = estacionesCerradas.find(
               (e) =>
                  e.id === estacionId &&
                  e.razon === "Alta actividad de reportes"
            );
            return !!estacionCerrada;
         }
      );

      const estacionesCerradasDefinitivamente = rutaOptima.path.filter(
         (estacion: any) => {
            const estacionId = `${estacion.nombre} - ${estacion.linea}`;
            const estacionCerrada = estacionesCerradas.find(
               (e) =>
                  e.id === estacionId &&
                  e.razon !== "Alta actividad de reportes"
            );
            return !!estacionCerrada;
         }
      );

      // CASO 1: Hay estaciones cerradas definitivamente - Solo mostrar ruta alternativa
      if (estacionesCerradasDefinitivamente.length > 0) {
         // Restaurar estado original primero
         estacionesOriginalesDeshabilitadas.forEach((estacion) => {
            grafo[estacion].activa = false;
         });

         // Calcular SOLO la ruta alternativa (sin las estaciones cerradas)
         const rutaAlternativaCalculada = dijkstra(
            grafo,
            routes.start,
            routes.end
         );

         if (
            rutaAlternativaCalculada.distance !== Infinity &&
            rutaAlternativaCalculada.path.length > 0
         ) {
            setResult(rutaAlternativaCalculada);
            setCoordenadas(
               rutaAlternativaCalculada.path.map((s: any) => ({
                  latitude: s.coordenadas.latitude,
                  longitude: s.coordenadas.longitude,
               }))
            );
            setRutaAlternativa(null);
            setCoordenadasAlternativas(null);
            setHayEstacionesCerradasDefinitivamente(true);
            const nombresEstaciones = estacionesCerradasDefinitivamente
               .map((e: any) => e.nombre)
               .join(", ");
            setMensajeRutas(
               `🚫 Estaciones cerradas: ${nombresEstaciones}. Se muestra la ruta alternativa disponible.`
            );
         } else {
            setResult(null);
            setCoordenadas(null);
            setRutaAlternativa(null);
            setCoordenadasAlternativas(null);
            setHayEstacionesCerradasDefinitivamente(true);
            const nombresEstaciones = estacionesCerradasDefinitivamente
               .map((e: any) => e.nombre)
               .join(", ");
            setMensajeRutas(
               `❌ No hay rutas disponibles. Estaciones cerradas: ${nombresEstaciones}.`
            );
         }
         setLoading(false);
         return;
      }

      // CASO 2: Solo hay estaciones con alta demanda - Mostrar ambas rutas
      if (estacionesConAltaDemanda.length > 0) {
         setHayEstacionesCerradasDefinitivamente(false);
         // Deshabilitar las estaciones con alta actividad de reportes
         estacionesConAltaDemanda.forEach((estacion: any) => {
            const estacionId = `${estacion.nombre} - ${estacion.linea}`;
            grafo[estacionId].activa = false;
         });

         // Calcular ruta alternativa evitando estaciones problemáticas
         const rutaAlternativaCalculada = dijkstra(
            grafo,
            routes.start,
            routes.end
         );

         // Restaurar las estaciones que deshabilitamos para la alternativa
         estacionesConAltaDemanda.forEach((estacion: any) => {
            const estacionId = `${estacion.nombre} - ${estacion.linea}`;
            grafo[estacionId].activa = true;
         });

         // Si existe una ruta alternativa válida
         if (
            rutaAlternativaCalculada.distance !== Infinity &&
            rutaAlternativaCalculada.path.length > 0
         ) {
            setRutaAlternativa(rutaAlternativaCalculada);
            setCoordenadasAlternativas(
               rutaAlternativaCalculada.path.map((s: any) => ({
                  latitude: s.coordenadas.latitude,
                  longitude: s.coordenadas.longitude,
               }))
            );
            const nombresEstaciones = estacionesConAltaDemanda
               .map((e: any) => e.nombre)
               .join(", ");
            setMensajeRutas(
               `⚠️ Hay una ruta más corta (azul), pero contiene estaciones con alta demanda de reportes: ${nombresEstaciones}. Se muestra una ruta alternativa en verde.`
            );
         } else {
            // No hay ruta alternativa válida
            setRutaAlternativa(null);
            setCoordenadasAlternativas(null);
            const nombresEstaciones = estacionesConAltaDemanda
               .map((e: any) => e.nombre)
               .join(", ");
            setMensajeRutas(
               `⚠️ La ruta más corta contiene estaciones con alta demanda de reportes: ${nombresEstaciones}. No hay rutas alternativas disponibles.`
            );
         }
      } else {
         setRutaAlternativa(null);
         setCoordenadasAlternativas(null);
         setMensajeRutas("");
         setHayEstacionesCerradasDefinitivamente(false);
      }

      // PASO 5: Restaurar el estado original de las estaciones
      estacionesOriginalesDeshabilitadas.forEach((estacion) => {
         grafo[estacion].activa = false;
      });

      // Establecer la ruta óptima como resultado principal
      setResult(rutaOptima);
      setCoordenadas(
         rutaOptima.path.map((s: any) => ({
            latitude: s.coordenadas.latitude,
            longitude: s.coordenadas.longitude,
         }))
      );
      setLoading(false);
   }, [routes, estacionesCerradas]);

   // Mostrar alerta cuando hay cambios en la ruta
   useEffect(() => {
      if (!alertaMostrada && !isLoading && mensajeRutas.length > 0) {
         setAlertaMostrada(true);

         if (hayEstacionesCerradasDefinitivamente) {
            Alert.alert(
               "🚫 Ruta Modificada",
               "La ruta original contiene estaciones cerradas. Se ha calculado una ruta alternativa para evitarlas.",
               [
                  {
                     text: "Entendido",
                     style: "default",
                  },
               ]
            );
         } else if (rutaAlternativa) {
            Alert.alert(
               "⚠️ Ruta con Problemas",
               "La ruta más corta contiene estaciones con alta demanda de reportes. Se muestra una ruta alternativa para evitarlas.",
               [
                  {
                     text: "Ver Rutas",
                     style: "default",
                  },
               ]
            );
         }
      }
   }, [
      mensajeRutas,
      isLoading,
      alertaMostrada,
      hayEstacionesCerradasDefinitivamente,
      rutaAlternativa,
   ]);

   useEffect(() => {
      const collectionRef = collection(db, "estaciones_cerradas");
      const q = query(collectionRef);

      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
         const data = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            razon: doc.data().razon || "",
         }));
         setEstacionesCerradas(data);
         // Bloquear todas las estaciones cerradas en el grafo
         Object.keys(grafo).forEach((estacion) => {
            const estacionCerrada = data.find((e) => e.id === estacion);
            grafo[estacion].activa = !estacionCerrada;
         });
         setLoading3(false);
      });
      return unsubscribe;
   }, []);

   if (isLoading || isLoading2 || isLoading3) {
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

            {coordenadasAlternativas && coordenadasAlternativas.length > 0 && (
               <Polyline
                  coordinates={coordenadasAlternativas}
                  strokeWidth={5}
                  strokeColor="green"
               />
            )}

            {rutaAlternativa?.path.map((r: any, i: number) => (
               <Marker
                  coordinate={r.coordenadas}
                  key={`alt-${i}`}
                  title={r.nombre}
                  description={`${r.linea} (Ruta alternativa)`}
                  pinColor="green"
               />
            ))}
         </MapView>

         {coordenadas && coordenadas.length > 0 && (
            <View style={styles.floatingButtons}>
               <TouchableOpacity
                  style={styles.fab}
                  onPress={() => setModal(true)}
               >
                  <Feather name="info" size={24} color="#fff" />
               </TouchableOpacity>
            </View>
         )}

         <Modal
            animationType="slide"
            visible={modal}
            onRequestClose={() => setModal(false)}
         >
            <View style={styles.modalContainer}>
               <Text style={styles.modalTitle}>Instrucciones de la Ruta</Text>

               {mensajeRutas.length > 0 && (
                  <View style={styles.modalWarning}>
                     <Feather name="alert-triangle" size={20} color="#ff9800" />
                     <Text style={styles.modalWarningText}>{mensajeRutas}</Text>
                  </View>
               )}

               <Text style={styles.routeLabel}>
                  {hayEstacionesCerradasDefinitivamente
                     ? "Ruta Alternativa por estación cerrada"
                     : "Ruta Principal (Azul)"}{" "}
                  {mensajeRutas.length > 0 &&
                     !hayEstacionesCerradasDefinitivamente &&
                     "- Con estaciones reportadas"}
               </Text>
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
                                 {
                                    backgroundColor:
                                       lineaColors[item.linea] || "#ccc",
                                 },
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

               {rutaAlternativa && (
                  <>
                     <Text style={[styles.routeLabel, { marginTop: 20 }]}>
                        Ruta Alternativa (Verde) - Evita estaciones reportadas
                     </Text>
                     <FlatList
                        data={rutaAlternativa?.path.map((s: any) => ({
                           nombre: s.nombre,
                           linea: s.linea,
                        }))}
                        keyExtractor={(_, index) => `alt-${index.toString()}`}
                        renderItem={({ item, index }) => (
                           <View
                              style={[styles.stepCard, styles.alternativeCard]}
                           >
                              <View style={styles.stepRow}>
                                 <Text style={styles.stepText}>
                                    {index + 1}. {item.nombre} - {item.linea}
                                 </Text>
                                 <View
                                    style={[
                                       styles.lineDot,
                                       {
                                          backgroundColor:
                                             lineaColors[item.linea] || "#ccc",
                                       },
                                    ]}
                                 />
                              </View>
                           </View>
                        )}
                        ItemSeparatorComponent={() => (
                           <View style={styles.separator}>
                              <Feather
                                 name="arrow-down"
                                 size={24}
                                 color="#4CAF50"
                              />
                           </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 20 }}
                     />
                  </>
               )}

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
      justifyContent: "center",
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
   modalWarning: {
      flexDirection: "row",
      backgroundColor: "#fff3cd",
      padding: 12,
      borderRadius: 8,
      marginBottom: 15,
      alignItems: "center",
      gap: 10,
      borderLeftWidth: 4,
      borderLeftColor: "#ff9800",
   },
   modalWarningText: {
      flex: 1,
      color: "#856404",
      fontSize: 13,
      fontWeight: "500",
   },
   routeLabel: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 10,
      marginTop: 5,
   },
   alternativeCard: {
      borderLeftWidth: 3,
      borderLeftColor: "#4CAF50",
   },
});
