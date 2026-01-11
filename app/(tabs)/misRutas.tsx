import { auth, db } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import {
   addDoc,
   collection,
   onSnapshot,
   query,
   where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
   ActivityIndicator,
   Alert,
   BackHandler,
   FlatList,
   Keyboard,
   Modal,
   StyleSheet,
   Text,
   ToastAndroid,
   TouchableOpacity,
   View,
} from "react-native";
import Autocomplete from "react-native-autocomplete-input";
import MapView, { Marker, Polyline } from "react-native-maps";
import {
   arregloEstaciones,
   dijkstra,
   grafo,
   lines,
   mapStyle,
   origin2,
} from "../../assets/data/info";

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

export default function MisRutas() {
   useFocusEffect(
      useCallback(() => {
         const onBackPress = () => {
            Alert.alert(
               "¿Salir de la app?",
               "¿Estás segura/o de que quieres salir?",
               [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Salir", onPress: () => BackHandler.exitApp() },
               ]
            );
            return true;
         };

         const subscription = BackHandler.addEventListener(
            "hardwareBackPress",
            onBackPress
         );
         return () => subscription.remove();
      }, [])
   );

   const [estacionesCerradas, setEstacionesCerradas] = useState<
      { id: string; razon: string }[]
   >([]);
   const [loading1, isLoading1] = useState(true);
   const [loading2, isLoading2] = useState(true);

   const [start, setStart] = useState("");
   const [end, setEnd] = useState("");
   const [modal, setModal] = useState(false);
   const [modalStart, setModalStart] = useState(false);
   const [modalEnd, setModalEnd] = useState(false);
   const [searchStart, setSearchStart] = useState("");
   const [searchEnd, setSearchEnd] = useState("");

   const [hideS, setHideS] = useState(false);
   const [hideE, setHideE] = useState(false);

   const [rutaAlternativa, setRutaAlternativa] = useState<any>(null);
   const [mensajeRutas, setMensajeRutas] = useState("");
   const [result, setResult] = useState<any>(null);
   const [
      hayEstacionesCerradasDefinitivamente,
      setHayEstacionesCerradasDefinitivamente,
   ] = useState(false);

   useEffect(() => {
      const estacionCerrada = estacionesCerradas.find((e) => e.id === start);
      if (estacionCerrada) {
         if (estacionCerrada.razon === "Alta actividad de reportes") {
            ToastAndroid.show(
               "Se están presentando retrasos en esta línea, tome precaución",
               ToastAndroid.LONG
            );
         } else {
            Alert.alert(
               `${start} `,
               `Estación cerrada o con fallas, sin rutas por desplegar`,
               [
                  {
                     text: "OK",
                     onPress: () => setStart(""),
                  },
               ]
            );
         }
      }
   }, [start, estacionesCerradas]);

   useEffect(() => {
      const estacionCerrada = estacionesCerradas.find((e) => e.id === end);
      if (estacionCerrada) {
         if (estacionCerrada.razon === "Alta actividad de reportes") {
            ToastAndroid.show(
               "Se están presentando retrasos en esta línea, tome precaución",
               ToastAndroid.LONG
            );
         } else {
            Alert.alert(
               `${end} `,
               `Estación cerrada o con fallas, sin rutas por desplegar`,
               [
                  {
                     text: "OK",
                     onPress: () => setEnd(""),
                  },
               ]
            );
         }
      }
   }, [end, estacionesCerradas]);

   const handleSelectS = (estacion: string) => {
      setStart(estacion);
      setHideS(true);
   };

   const handleSelectE = (estacion: string) => {
      setEnd(estacion);
      setHideE(true);
   };

   // Calcular rutas cuando cambien start, end o estacionesCerradas
   useEffect(() => {
      if (!start || !end) {
         setResult(null);
         setRutaAlternativa(null);
         setMensajeRutas("");
         return;
      }

      console.log("=== INICIO ===");
      console.log("Origen:", start);
      console.log("Destino:", end);
      console.log("Estaciones cerradas:", estacionesCerradas);

      // PASO 1: Habilitar TODAS las estaciones temporalmente (ignorar cierres)
      const estacionesOriginalesDeshabilitadas: string[] = [];
      Object.keys(grafo).forEach((estacion) => {
         if (!grafo[estacion].activa) {
            estacionesOriginalesDeshabilitadas.push(estacion);
            grafo[estacion].activa = true;
         }
      });

      // PASO 2: Calcular la ruta MÁS CORTA sin restricciones
      const rutaOptima = dijkstra(grafo, start, end);
      console.log("Ruta óptima calculada, nodos:", rutaOptima.path.length);

      // PASO 3: Verificar si la ruta óptima contiene estaciones cerradas
      const estacionesConAltaDemanda = rutaOptima.path.filter((estacion) => {
         const estacionId = `${estacion.nombre} - ${estacion.linea}`;
         const estacionCerrada = estacionesCerradas.find(
            (e) =>
               e.id === estacionId && e.razon === "Alta actividad de reportes"
         );
         return !!estacionCerrada;
      });

      const estacionesCerradasDefinitivamente = rutaOptima.path.filter(
         (estacion) => {
            const estacionId = `${estacion.nombre} - ${estacion.linea}`;
            const estacionCerrada = estacionesCerradas.find(
               (e) =>
                  e.id === estacionId &&
                  e.razon !== "Alta actividad de reportes"
            );
            return !!estacionCerrada;
         }
      );

      console.log(
         "Estaciones con alta demanda:",
         estacionesConAltaDemanda.length
      );
      console.log(
         "Estaciones cerradas definitivamente:",
         estacionesCerradasDefinitivamente.length
      );

      // CASO 1: Hay estaciones cerradas definitivamente - Solo mostrar ruta alternativa
      if (estacionesCerradasDefinitivamente.length > 0) {
         // Restaurar estado original primero
         estacionesOriginalesDeshabilitadas.forEach((estacion) => {
            grafo[estacion].activa = false;
         });

         // Calcular SOLO la ruta alternativa (sin las estaciones cerradas)
         const rutaAlternativaCalculada = dijkstra(grafo, start, end);

         if (
            rutaAlternativaCalculada.distance !== Infinity &&
            rutaAlternativaCalculada.path.length > 0
         ) {
            setResult(rutaAlternativaCalculada);
            setRutaAlternativa(null);
            setHayEstacionesCerradasDefinitivamente(true);
            const nombresEstaciones = estacionesCerradasDefinitivamente
               .map((e) => e.nombre)
               .join(", ");
            setMensajeRutas(
               `🚫 Estaciones cerradas: ${nombresEstaciones}. Se muestra la ruta alternativa disponible.`
            );
            console.log("🚫 Ruta con estaciones cerradas definitivamente");
         } else {
            setResult(null);
            setRutaAlternativa(null);
            setHayEstacionesCerradasDefinitivamente(true);
            const nombresEstaciones = estacionesCerradasDefinitivamente
               .map((e) => e.nombre)
               .join(", ");
            setMensajeRutas(
               `❌ No hay rutas disponibles. Estaciones cerradas: ${nombresEstaciones}.`
            );
            console.log("❌ No hay ruta disponible");
         }
         console.log("=== FIN ===");
         return;
      }

      // CASO 2: Solo hay estaciones con alta demanda - Mostrar ambas rutas
      if (estacionesConAltaDemanda.length > 0) {
         setHayEstacionesCerradasDefinitivamente(false);
         // Deshabilitar las estaciones con alta actividad de reportes
         estacionesConAltaDemanda.forEach((estacion) => {
            const estacionId = `${estacion.nombre} - ${estacion.linea}`;
            grafo[estacionId].activa = false;
         });

         // Calcular ruta alternativa evitando estaciones problemáticas
         const rutaAlternativaCalculada = dijkstra(grafo, start, end);
         console.log("Ruta alternativa calculada");

         // Restaurar las estaciones que deshabilitamos para la alternativa
         estacionesConAltaDemanda.forEach((estacion) => {
            const estacionId = `${estacion.nombre} - ${estacion.linea}`;
            grafo[estacionId].activa = true;
         });

         // Si existe una ruta alternativa válida
         if (
            rutaAlternativaCalculada.distance !== Infinity &&
            rutaAlternativaCalculada.path.length > 0
         ) {
            setRutaAlternativa(rutaAlternativaCalculada);
            const nombresEstaciones = estacionesConAltaDemanda
               .map((e) => e.nombre)
               .join(", ");
            setMensajeRutas(
               `⚠️ Hay una ruta más corta (azul), pero contiene estaciones con alta demanda de reportes: ${nombresEstaciones}. Se muestra una ruta alternativa en verde.`
            );
            console.log("✅ Mensaje establecido:", nombresEstaciones);
         } else {
            // No hay ruta alternativa válida, solo mostrar la óptima con advertencia
            setRutaAlternativa(null);
            const nombresEstaciones = estacionesConAltaDemanda
               .map((e) => e.nombre)
               .join(", ");
            setMensajeRutas(
               `⚠️ La ruta más corta contiene estaciones con alta demanda de reportes: ${nombresEstaciones}. No hay rutas alternativas disponibles.`
            );
            console.log("⚠️ No hay ruta alternativa válida");
         }
      } else {
         setRutaAlternativa(null);
         setMensajeRutas("");
         setHayEstacionesCerradasDefinitivamente(false);
         console.log("✅ No hay estaciones con problemas en la ruta");
      }

      // PASO 5: Restaurar el estado original de las estaciones
      estacionesOriginalesDeshabilitadas.forEach((estacion) => {
         grafo[estacion].activa = false;
      });

      // Establecer la ruta óptima como resultado principal
      setResult(rutaOptima);
      console.log("=== DEBUG FIN ===");
   }, [start, end, estacionesCerradas]);

   const filteredEstacionesS = start
      ? arregloEstaciones.filter((n) =>
           n?.toLowerCase().includes(start.toLowerCase())
        )
      : [];

   const filteredEstacionesE = end
      ? arregloEstaciones.filter((n) =>
           n?.toLowerCase().includes(end.toLowerCase())
        )
      : [];

   const coordenadas = result?.path.map((s: any) => ({
      latitude: s.coordenadas.latitude,
      longitude: s.coordenadas.longitude,
   }));

   const coordenadasAlternativas = rutaAlternativa?.path.map((s: any) => ({
      latitude: s.coordenadas.latitude,
      longitude: s.coordenadas.longitude,
   }));

   const [routes, setRoutes] = useState<any>([]);
   const user = auth.currentUser;
   const routesCollection = collection(db, "rutas_guardadas");

   const fetchRoutes = async () => {
      if (user) {
         const q = query(routesCollection, where("userId", "==", user.uid));
         const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data = querySnapshot.docs.map((doc) => doc.data());
            setRoutes(data.map((doc) => ({ ...doc })));
            isLoading2(false);
         });
         return unsubscribe;
      } else {
         console.log("Ningun usuario loggeado");
      }
   };

   const addRoutes = async (start: string, end: string) => {
      if (user) {
         if (
            routes.length > 0 &&
            routes.some(
               (r: { start: string; end: string }) =>
                  r.start === start && r.end === end
            )
         ) {
            ToastAndroid.show(
               "Ruta anteriormente guardada",
               ToastAndroid.SHORT
            );
         } else {
            isLoading2(true);
            ToastAndroid.show("Ruta guardada", ToastAndroid.SHORT);
            await addDoc(routesCollection, { start, end, userId: user.uid });
            setRoutes([]);
            fetchRoutes();
         }
      } else {
         console.log("Ningun usuario loggeado");
      }
   };

   useEffect(() => {
      const collectionRef = collection(db, "estaciones_cerradas");
      const q = query(collectionRef);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
         const data = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            razon: doc.data().razon || "",
         }));
         setEstacionesCerradas(data);
         // Bloquear todas las estaciones cerradas en el grafo
         // (incluyendo las de alta actividad de reportes para rutas intermedias)
         Object.keys(grafo).forEach((estacion) => {
            const estacionCerrada = data.find((e) => e.id === estacion);
            grafo[estacion].activa = !estacionCerrada;
         });
         isLoading1(false);
      });
      return unsubscribe;
   }, []);

   useEffect(() => {
      fetchRoutes();
   }, [user]);

   if (loading1 || loading2) {
      return (
         <View style={styles.container}>
            <ActivityIndicator size="large" color="#e68059" />
         </View>
      );
   }

   return (
      <View style={styles.container}>
         {/* Header Dramático */}
         <View style={styles.header}>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />
            <View style={styles.headerContent}>
               <View style={styles.iconContainer}>
                  <Feather name="navigation" size={32} color="#fff" />
               </View>
               <Text style={styles.headerTitle}>Mis Rutas</Text>
               <Text style={styles.headerSubtitle}>
                  Encuentra la mejor ruta en el metro
               </Text>
            </View>
         </View>

         <View style={styles.searchCard}>
            <Text style={styles.switchText}>Selecciona tus estaciones</Text>
            {mensajeRutas.length > 0 && (
               <View style={styles.warningCard}>
                  <Feather name="alert-triangle" size={20} color="#D97706" />
                  <Text style={styles.warningText}>{mensajeRutas}</Text>
               </View>
            )}
            
            <View style={styles.stationButtonsRow}>
               <TouchableOpacity 
                  style={[styles.stationButton, start && styles.stationButtonActive]}
                  onPress={() => setModalStart(true)}
               >
                  <View style={styles.stationButtonIcon}>
                     <Feather name="map-pin" size={20} color={start ? "#E68059" : "#9CA3AF"} />
                  </View>
                  <View style={styles.stationButtonText}>
                     <Text style={styles.stationButtonLabel}>Origen</Text>
                     <Text style={styles.stationButtonValue} numberOfLines={1}>
                        {start || "Selecciona"}
                     </Text>
                  </View>
                  {start && (
                     <TouchableOpacity 
                        onPress={() => setStart("")}
                        style={styles.stationButtonClear}
                     >
                        <Feather name="x" size={16} color="#9CA3AF" />
                     </TouchableOpacity>
                  )}
               </TouchableOpacity>

               <TouchableOpacity 
                  style={[styles.stationButton, end && styles.stationButtonActive]}
                  onPress={() => setModalEnd(true)}
               >
                  <View style={styles.stationButtonIcon}>
                     <Feather name="flag" size={20} color={end ? "#E68059" : "#9CA3AF"} />
                  </View>
                  <View style={styles.stationButtonText}>
                     <Text style={styles.stationButtonLabel}>Destino</Text>
                     <Text style={styles.stationButtonValue} numberOfLines={1}>
                        {end || "Selecciona"}
                     </Text>
                  </View>
                  {end && (
                     <TouchableOpacity 
                        onPress={() => setEnd("")}
                        style={styles.stationButtonClear}
                     >
                        <Feather name="x" size={16} color="#9CA3AF" />
                     </TouchableOpacity>
                  )}
               </TouchableOpacity>
            </View>
         </View>

         {/* Modal de Selección de Origen */}
         <Modal
            visible={modalStart}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalStart(false)}
         >
            <View style={styles.modalOverlay}>
               <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Selecciona el Origen</Text>
                     <TouchableOpacity onPress={() => setModalStart(false)}>
                        <Feather name="x" size={24} color="#111827" />
                     </TouchableOpacity>
                  </View>
                  
                  <View style={styles.searchInputContainer}>
                     <Feather name="search" size={20} color="#9CA3AF" />
                     <Autocomplete
                        data={searchStart ? arregloEstaciones.filter((n) =>
                           n?.toLowerCase().includes(searchStart.toLowerCase())
                        ) : []}
                        autoCorrect={false}
                        placeholder="Buscar estación..."
                        placeholderTextColor="#9CA3AF"
                        value={searchStart}
                        onChangeText={setSearchStart}
                        hideResults={false}
                        flatListProps={{
                           keyExtractor: (_, idx) => idx.toString(),
                           renderItem: ({ item }) => (
                              <TouchableOpacity 
                                 onPress={() => {
                                    setStart(item);
                                    setSearchStart("");
                                    setModalStart(false);
                                 }}
                                 style={styles.modalStationItem}
                              >
                                 <Feather name="map-pin" size={18} color="#E68059" />
                                 <Text style={styles.modalStationText}>{item}</Text>
                              </TouchableOpacity>
                           ),
                           keyboardShouldPersistTaps: "always",
                        }}
                        inputContainerStyle={styles.modalSearchInput}
                        listContainerStyle={styles.modalList}
                        containerStyle={{ flex: 1 }}
                     />
                  </View>
               </View>
            </View>
         </Modal>

         {/* Modal de Selección de Destino */}
         <Modal
            visible={modalEnd}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalEnd(false)}
         >
            <View style={styles.modalOverlay}>
               <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Selecciona el Destino</Text>
                     <TouchableOpacity onPress={() => setModalEnd(false)}>
                        <Feather name="x" size={24} color="#111827" />
                     </TouchableOpacity>
                  </View>
                  
                  <View style={styles.searchInputContainer}>
                     <Feather name="search" size={20} color="#9CA3AF" />
                     <Autocomplete
                        data={searchEnd ? arregloEstaciones.filter((n) =>
                           n?.toLowerCase().includes(searchEnd.toLowerCase())
                        ) : []}
                        autoCorrect={false}
                        placeholder="Buscar estación..."
                        placeholderTextColor="#9CA3AF"
                        value={searchEnd}
                        onChangeText={setSearchEnd}
                        hideResults={false}
                        flatListProps={{
                           keyExtractor: (_, idx) => idx.toString(),
                           renderItem: ({ item }) => (
                              <TouchableOpacity 
                                 onPress={() => {
                                    setEnd(item);
                                    setSearchEnd("");
                                    setModalEnd(false);
                                 }}
                                 style={styles.modalStationItem}
                              >
                                 <Feather name="flag" size={18} color="#E68059" />
                                 <Text style={styles.modalStationText}>{item}</Text>
                              </TouchableOpacity>
                           ),
                           keyboardShouldPersistTaps: "always",
                        }}
                        inputContainerStyle={styles.modalSearchInput}
                        listContainerStyle={styles.modalList}
                        containerStyle={{ flex: 1 }}
                     />
                  </View>
               </View>
            </View>
         </Modal>

         <View style={{ flex: 4 }}>
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
               {coordenadasAlternativas &&
                  coordenadasAlternativas.length > 0 && (
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
                     onPress={() => addRoutes(start, end)}
                  >
                     <Feather name="save" size={24} color="#fff" />
                  </TouchableOpacity>

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
                  <Text style={styles.modalTitle}>
                     Instrucciones de la Ruta
                  </Text>

                  {mensajeRutas.length > 0 && (
                     <View style={styles.modalWarning}>
                        <Feather
                           name="alert-triangle"
                           size={20}
                           color="#ff9800"
                        />
                        <Text style={styles.modalWarningText}>
                           {mensajeRutas}
                        </Text>
                     </View>
                  )}

                  <Text style={styles.routeLabel}>
                     {hayEstacionesCerradasDefinitivamente
                        ? "Ruta Alternativa por Cierres"
                        : "Ruta Principal (Azul)"}{" "}
                     {mensajeRutas.length > 0 &&
                        !hayEstacionesCerradasDefinitivamente &&
                        "- Con estaciones reportadas"}
                  </Text>
                  <FlatList
                     data={result?.path.flatMap((s: any) => ({
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
                           <Feather
                              name="arrow-down"
                              size={24}
                              color="#e68059"
                           />
                        </View>
                     )}
                     contentContainerStyle={{ paddingBottom: 20 }}
                  />

                  {rutaAlternativa && (
                     <>
                        <Text style={[styles.routeLabel, { marginTop: 20 }]}>
                           Ruta Alternativa (Verde) - Evita estaciones
                           reportadas
                        </Text>
                        <FlatList
                           data={rutaAlternativa?.path.flatMap((s: any) => ({
                              nombre: s.nombre,
                              linea: s.linea,
                           }))}
                           keyExtractor={(_, index) =>
                              `alt-${index.toString()}`
                           }
                           renderItem={({ item, index }) => (
                              <View
                                 style={[
                                    styles.stepCard,
                                    styles.alternativeCard,
                                 ]}
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
                                                lineaColors[item.linea] ||
                                                "#ccc",
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
                     style={styles.closeButton}
                     onPress={() => setModal(false)}
                  >
                     <Text style={styles.closeButtonText}>Cerrar</Text>
                  </TouchableOpacity>
               </View>
            </Modal>
         </View>
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: "#F9FAFB",
   },
   
   /* Header Dramático */
   header: {
      backgroundColor: "#E68059",
      paddingTop: 50,
      paddingBottom: 120,
      position: "relative",
      overflow: "hidden",
   },
   decorativeCircle1: {
      position: "absolute",
      top: -80,
      right: -60,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
   },
   decorativeCircle2: {
      position: "absolute",
      top: 20,
      right: 40,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
   },
   decorativeCircle3: {
      position: "absolute",
      top: 60,
      right: -20,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "rgba(255, 255, 255, 0.12)",
   },
   headerContent: {
      alignItems: "center",
      zIndex: 1,
   },
   iconContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "rgba(255, 255, 255, 0.25)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
   },
   headerTitle: {
      fontSize: 28,
      fontWeight: "900",
      color: "#fff",
      marginBottom: 6,
      textShadowColor: "rgba(0, 0, 0, 0.15)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
   },
   headerSubtitle: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.95)",
      fontWeight: "600",
   },
   
   /* Tarjeta de Búsqueda */
   searchCard: {
      marginTop: -90,
      marginHorizontal: 20,
      backgroundColor: "white",
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 999,
   },
   switchText: {
      color: "#374151",
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 16,
      textAlign: "center",
   },
   
   /* Botones de Estación */
   stationButtonsRow: {
      flexDirection: "row",
      gap: 12,
   },
   stationButton: {
      flex: 1,
      backgroundColor: "#F9FAFB",
      borderRadius: 12,
      padding: 14,
      borderWidth: 2,
      borderColor: "#E5E7EB",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minHeight: 70,
   },
   stationButtonActive: {
      backgroundColor: "#FFF7ED",
      borderColor: "#E68059",
   },
   stationButtonIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#fff",
      justifyContent: "center",
      alignItems: "center",
   },
   stationButtonText: {
      flex: 1,
   },
   stationButtonLabel: {
      fontSize: 11,
      color: "#6B7280",
      fontWeight: "700",
      marginBottom: 2,
      textTransform: "uppercase",
   },
   stationButtonValue: {
      fontSize: 14,
      color: "#111827",
      fontWeight: "700",
   },
   stationButtonClear: {
      padding: 4,
   },
   
   /* Modales */
   modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
   },
   modalContent: {
      backgroundColor: "#fff",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: "80%",
   },
   modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
   },
   modalTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: "#111827",
   },
   searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#F9FAFB",
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 2,
      borderColor: "#E5E7EB",
   },
   modalSearchInput: {
      borderWidth: 0,
      paddingVertical: 12,
      fontSize: 15,
      color: "#111827",
      fontWeight: "600",
   },
   modalList: {
      maxHeight: 400,
      backgroundColor: "#fff",
      borderRadius: 12,
      marginTop: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
   },
   modalStationItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
   },
   modalStationText: {
      fontSize: 15,
      color: "#374151",
      fontWeight: "600",
      flex: 1,
   },
   
   /* Inputs */
   inputUber: {
      borderWidth: 0,
      borderBottomWidth: 2,
      borderColor: "#E5E7EB",
      paddingVertical: 16,
      paddingHorizontal: 12,
      fontSize: 16,
      color: "#111827",
      fontWeight: "600",
      minHeight: 50,
   },
   
   /* Warnings */
   warningCard: {
      flexDirection: "row",
      backgroundColor: "#FEF3C7",
      padding: 14,
      borderRadius: 12,
      marginBottom: 14,
      alignItems: "flex-start",
      gap: 10,
      borderLeftWidth: 4,
      borderLeftColor: "#F59E0B",
      shadowColor: "#F59E0B",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
   },
   warningText: {
      flex: 1,
      color: "#78350F",
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
   },
   
   /* Botones Flotantes */
   floatingButtons: {
      position: "absolute",
      bottom: 30,
      right: 20,
      flexDirection: "column",
      gap: 15,
      zIndex: 999,
   },
   fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#E68059",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#E68059",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
   },
   
   /* Clear Icon */
   clearIconWrapper: {
      position: "absolute",
      right: 10,
      top: "50%",
      transform: [{ translateY: -12 }],
      zIndex: 2,
   },
   /* Modal */
   modalContainer: {
      flex: 1,
      backgroundColor: "#F9FAFB",
      padding: 20,
      paddingTop: 50,
   },
   modalWarning: {
      flexDirection: "row",
      backgroundColor: "#FEF3C7",
      padding: 14,
      borderRadius: 12,
      marginBottom: 16,
      alignItems: "flex-start",
      gap: 10,
      borderLeftWidth: 4,
      borderLeftColor: "#F59E0B",
   },
   modalWarningText: {
      flex: 1,
      color: "#78350F",
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
   },
   stepCard: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: "#fff",
      borderWidth: 2,
      borderColor: "#E5E7EB",
      marginHorizontal: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
   },
   stepText: {
      fontSize: 15,
      color: "#374151",
      fontWeight: "700",
   },
   stepRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
   },
   lineDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      marginLeft: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
   },
   separator: {
      alignItems: "center",
      marginVertical: 8,
      opacity: 0.5,
   },
   closeButton: {
      backgroundColor: "#E68059",
      padding: 16,
      borderRadius: 12,
      marginTop: 20,
      shadowColor: "#E68059",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
   },
   closeButtonText: {
      color: "#fff",
      fontWeight: "800",
      textAlign: "center",
      fontSize: 15,
   },
   routeLabel: {
      fontSize: 16,
      fontWeight: "800",
      color: "#111827",
      marginBottom: 10,
      marginTop: 8,
   },
   alternativeCard: {
      borderLeftWidth: 4,
      borderLeftColor: "#10B981",
   },
   list: {
      zIndex: 1,
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      maxHeight: 300,
      backgroundColor: "#fff",
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
   },
   autocompleteItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
   },
   autocompleteText: {
      fontSize: 14,
      color: "#374151",
      fontWeight: "600",
   },
});
