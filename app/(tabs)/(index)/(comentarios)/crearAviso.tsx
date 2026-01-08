import { lineas, lines } from "@/assets/data/info";
import { auth, db } from "@/FirebaseConfig";
import { router } from "expo-router";
import { arrayUnion, doc, setDoc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import {
   ActivityIndicator,
   Alert,
   FlatList,
   LayoutAnimation,
   StyleSheet,
   Text,
   TextInput,
   TouchableOpacity,
   View,
} from "react-native";

const lineaColors: { [key: string]: string } = {
   "Línea 1": "#FFBCD4",
   "Línea 2": "#AFE3FF",
   "Línea 3": "#E2DCB4",
   "Línea 4": "#AACBC5",
   "Línea 5": "#FFE15B",
   "Línea 6": "#FFACAC",
   "Línea 7": "#FFDECA",
   "Línea 8": "#A4D6C2",
   "Línea 9": "#A78474",
   "Línea A": "#C790C6",
   "Línea B": "#D9D9D9",
   "Línea 12": "#E0C98C",
};

export default function AddComment() {
   const [selectedLinea, setSelectedLinea] = useState<string | null>(null);
   const [selectedStation, setSelectedStation] = useState<string | null>(null);
   const [comment, setComment] = useState("");
   const [showLineasDropdown, setShowLineasDropdown] = useState(false);
   const [showEstacionesDropdown, setShowEstacionesDropdown] = useState(false);
   const [loading, setLoading] = useState(false); // <- nuevo estado

   const getStationsByLine = (lineaId: string) => {
      const linea = lines.find((l) => l.linea === lineaId);
      return linea ? linea.estaciones.map((est) => est.nombre) : [];
   };

   const handleSubmit = async () => {
      if (!selectedLinea || !selectedStation) {
         Alert.alert(
            "Error",
            "Selecciona una línea y una estación antes de continuar."
         );
         return;
      }
      if (!comment.trim()) {
         Alert.alert("Error", "El comentario no puede estar vacío.");
         return;
      }
      if (comment.length > 200) {
         Alert.alert(
            "Error",
            "El comentario no puede superar los 200 caracteres."
         );
         return;
      }

      const estacionId = `${selectedStation.replace(
         "/",
         "|"
      )} - ${selectedLinea}`;

      setLoading(true);
      const stationRef = doc(db, "estaciones", estacionId);
      const comentario = {
         usuario: auth.currentUser?.displayName || "Anónimo",
         texto: comment,
         hora: new Date().toLocaleString(),
      };
      try {
         await updateDoc(stationRef, {
            comentarios: arrayUnion(comentario),
         });

         Alert.alert(
            "Comentario agregado",
            "Tu comentario se ha guardado correctamente."
         );
         setComment("");
         setSelectedLinea(null);
         setSelectedStation(null);
         router.replace("/(index)");
      } catch (error: any) {
         if (error.code === "not-found") {
            // Documento no existe, así que lo creamos
            await setDoc(stationRef, {
               comentarios: [comentario],
            });
            Alert.alert(
               "Comentario agregado",
               "Tu comentario se ha guardado correctamente."
            );
            setComment("");
            setSelectedLinea(null);
            setSelectedStation(null);
            router.replace("/(index)");
         } else {
            console.error("Error al guardar comentario:", error);
            Alert.alert("Error", "No se pudo guardar el comentario.");
            return;
         }
      } finally {
         setLoading(false);
      }
   };

   const isFormComplete =
      !!selectedLinea && !!selectedStation && comment.trim().length > 0;

   return (
      <View style={styles.container}>
         <Text style={styles.title}>📝 Añadir Comentario</Text>

         {/* Línea */}
         <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
               LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut
               );
               setShowLineasDropdown(!showLineasDropdown);
            }}
         >
            <Text style={styles.dropdownText}>
               {selectedLinea
                  ? `🚇 ${selectedLinea}`
                  : "Selecciona una línea ▼"}
            </Text>
         </TouchableOpacity>

         {showLineasDropdown && (
            <FlatList
               data={lineas}
               keyExtractor={(item) => item}
               renderItem={({ item }) => {
                  const bgColor = lineaColors[item] || "#CCCCCC";
                  return (
                     <TouchableOpacity
                        style={[styles.lineItem, { backgroundColor: bgColor }]}
                        onPress={() => {
                           LayoutAnimation.configureNext(
                              LayoutAnimation.Presets.easeInEaseOut
                           );
                           setSelectedLinea(item);
                           setShowLineasDropdown(false);
                           setShowEstacionesDropdown(true);
                        }}
                     >
                        <Text style={[styles.lineText, { color: "#fff" }]}>
                           🚇 {item}
                        </Text>
                     </TouchableOpacity>
                  );
               }}
            />
         )}

         {/* Estación */}
         {selectedLinea && (
            <>
               <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                     LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut
                     );
                     setShowEstacionesDropdown(!showEstacionesDropdown);
                  }}
               >
                  <Text style={styles.dropdownText}>
                     {selectedStation
                        ? `📍 ${selectedStation}`
                        : "Selecciona una estación ▼"}
                  </Text>
               </TouchableOpacity>

               {showEstacionesDropdown && (
                  <FlatList
                     data={getStationsByLine(selectedLinea)}
                     keyExtractor={(item) => item}
                     renderItem={({ item }) => (
                        <TouchableOpacity
                           style={styles.stationItem}
                           onPress={() => {
                              LayoutAnimation.configureNext(
                                 LayoutAnimation.Presets.easeInEaseOut
                              );
                              setSelectedStation(item);
                              setShowEstacionesDropdown(false);
                           }}
                        >
                           <Text style={styles.stationText}>📍 {item}</Text>
                        </TouchableOpacity>
                     )}
                  />
               )}
            </>
         )}

         {/* Comentario */}
         <TextInput
            style={styles.input}
            placeholder="Escribe tu comentario (máx. 200 caracteres)"
            value={comment}
            onChangeText={setComment}
            maxLength={200}
            multiline
         />

         {/* Botón o loader */}
         {loading ? (
            <ActivityIndicator
               size="large"
               color="#e68059"
               style={{ marginTop: 20 }}
            />
         ) : (
            <TouchableOpacity
               style={[styles.button, !isFormComplete && styles.buttonDisabled]}
               onPress={handleSubmit}
               disabled={!isFormComplete}
            >
               <Text style={styles.buttonText}>Enviar Comentario</Text>
            </TouchableOpacity>
         )}
      </View>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, padding: 20, backgroundColor: "#fff" },
   title: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
      color: "#333",
   },
   dropdownButton: {
      backgroundColor: "#f1f1f1",
      padding: 15,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 10,
   },
   dropdownText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#333",
   },
   lineItem: {
      marginHorizontal: 10,
      marginVertical: 6,
      padding: 15,
      borderRadius: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
   },
   lineText: {
      fontSize: 16,
      fontWeight: "bold",
   },
   stationItem: {
      backgroundColor: "#fefefe",
      marginHorizontal: 10,
      marginVertical: 6,
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#ddd",
   },
   stationText: {
      fontSize: 15,
      fontWeight: "500",
      color: "#444",
   },
   input: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 12,
      padding: 15,
      marginTop: 20,
      marginBottom: 20,
      textAlignVertical: "top",
      fontSize: 15,
      backgroundColor: "#fafafa",
   },
   button: {
      backgroundColor: "#e68059",
      padding: 15,
      borderRadius: 12,
      alignItems: "center",
   },
   buttonDisabled: {
      backgroundColor: "#ccc",
   },
   buttonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
   },
});
