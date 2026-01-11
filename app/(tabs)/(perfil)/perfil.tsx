import { auth, storage } from "@/FirebaseConfig";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { User, signOut } from "firebase/auth";
import {
   deleteObject,
   getDownloadURL,
   listAll,
   ref,
   uploadBytes,
} from "firebase/storage";
import React, { useCallback, useEffect, useState } from "react";
import {
   Alert,
   BackHandler,
   Image,
   ScrollView,
   StyleSheet,
   Text,
   TouchableOpacity,
   View,
} from "react-native";

export default function MyAccountScreen() {
   const defaultImage =
      "https://i.pinimg.com/236x/d9/d8/8e/d9d88e3d1f74e2b8ced3df051cecb81d.jpg";
   const [image, setImage] = useState<any>(defaultImage);
   const [images, setImages] = useState<any[]>([]);
   const [user, setUser] = useState<User | null>(null);
   const [username, setUsername] = useState("Cargando...");
   const [email, setEmail] = useState("Cargando...");

   useEffect(() => {
      const user = auth.currentUser;
      if (user) {
         setUsername(user.displayName || "Sin nombre");
         setEmail(user.email || "Sin correo");
         setUser(user);
         fetchImages(user.uid);
      }
   }, [auth.currentUser?.displayName]);

   useEffect(() => {
      // Cargar la imagen de perfil actual
      if (images.length > 0) {
         setImage(images[0]);
      }
   }, [images]);

   const fetchImages = async (userId: any) => {
      try {
         const storageRef = ref(storage, `images/${userId}`);
         const result = await listAll(storageRef);
         const urls = await Promise.all(
            result.items.map((itemRef) => getDownloadURL(itemRef))
         );
         setImages(urls);
      } catch (error) {
         console.error("Error fetching images: ", error);
      }
   };

   const pickImage = async () => {
      const permissionResult =
         await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
         Alert.alert("Permiso requerido", "Se necesita acceso a tu galería.");
         return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ["images"],
         allowsEditing: true,
         aspect: [1, 1],
         quality: 1,
      });

      if (!result.canceled) {
         const selectedImageUri = result.assets[0].uri;
         setImage(selectedImageUri);
         // Automáticamente subir la imagen después de seleccionarla
         await uploadImageFromUri(selectedImageUri);
      }
   };

   const uploadImage = async () => {
      await uploadImageFromUri(image);
   };

   const uploadImageFromUri = async (imageUri: string) => {
      if (!user || !imageUri || imageUri === defaultImage) {
         console.log(`User: ${user}, Image: ${imageUri}`); // Add logging to check values
         Alert.alert("No hay imagen para subir!");
         return;
      }

      console.log("Attempting to upload image: ", imageUri); // Log the image URI for debugging

      try {
         // Si ya hay una imagen anterior, eliminarla
         if (images.length > 0) {
            const lastImage = images[images.length - 1];
            try {
               const oldStorageRef = ref(storage, lastImage);
               await deleteObject(oldStorageRef);
            } catch (error) {
               console.log("No se pudo eliminar la imagen anterior:", error);
            }
         }

         const response = await fetch(imageUri);
         const blob = await response.blob();

         console.log("Blob created: ", blob); // Log the blob for debugging

         const storageRef = ref(storage, `images/${user.uid}/${Date.now()}`);
         await uploadBytes(storageRef, blob);

         const url = await getDownloadURL(storageRef);
         setImages([url]); // Reemplazar la imagen anterior con la nueva
         setImage(url); // Actualizar la imagen mostrada con la URL de Firebase
         console.log("Image uploaded and URL retrieved: ", url);
         Alert.alert("¡Éxito!", "Imagen de perfil actualizada");
      } catch (error: any) {
         console.error("Error uploading image: ", error);
         Alert.alert("Error al subir!", error.message);
         setImage(images.length > 0 ? images[0] : defaultImage); // Revertir a la imagen anterior si falla
      }
   };

   const deleteImage = async (url: any) => {
      if (!user) {
         Alert.alert("No user found!");
         return;
      }

      try {
         const storageRef = ref(storage, url);
         await deleteObject(storageRef);
         setImages(images.filter((img) => img !== url));
      } catch (error: any) {
         console.error("Error deleting image: ", error);
         Alert.alert("Delete failed!", error.message);
      }
   };

   const handleLogout = async () => {
      try {
         await signOut(auth);
         router.replace("/(auth)"); // Redirige al login o pantalla de inicio
      } catch (error) {
         Alert.alert("Error", "No se pudo cerrar la sesión.");
      }
   };

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

   return (
      <View style={styles.container}>
         {/* Header con Imagen de Perfil */}
         <View style={styles.header}>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />
            
            <View style={styles.headerContent}>
               <View style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.profileImage} />
                  <TouchableOpacity style={styles.editButton} onPress={pickImage}>
                     <Feather name="camera" size={18} color="#fff" />
                  </TouchableOpacity>
               </View>
            </View>
         </View>

         {/* Tarjeta de Información */}
         <View style={styles.infoCard}>
            <View style={styles.infoRow}>
               <Feather name="user" size={20} color="#E68059" />
               <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Nombre</Text>
                  <Text style={styles.infoValue}>{username}</Text>
               </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
               <Feather name="mail" size={20} color="#E68059" />
               <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Correo electrónico</Text>
                  <Text style={styles.infoValue}>{email}</Text>
               </View>
            </View>
         </View>

         <ScrollView 
            style={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
         >
            <Text style={styles.sectionTitle}>Opciones</Text>
            
            <Option
               icon="bookmark"
               label="Rutas guardadas"
               description="Consulta tus rutas favoritas"
               onPress={() => router.push("./rutasGuardadas")}
            />
            <Option
               icon="settings"
               label="Modificar datos"
               description="Actualiza tu información"
               onPress={() => router.push("./configuracion")}
            />
            
            <TouchableOpacity
               style={styles.logoutButton}
               onPress={handleLogout}
               activeOpacity={0.8}
            >
               <Feather name="log-out" size={20} color="#DC2626" />
               <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
         </ScrollView>
      </View>
   );
}

const Option = ({
   icon,
   label,
   description,
   onPress,
}: {
   icon: string;
   label: string;
   description?: string;
   onPress?: () => void;
}) => (
   <TouchableOpacity style={styles.option} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.optionIconBg}>
         <Feather name={icon as any} size={22} color="#E68059" />
      </View>
      <View style={styles.optionContent}>
         <Text style={styles.optionText}>{label}</Text>
         {description && <Text style={styles.optionDescription}>{description}</Text>}
      </View>
      <Feather name="chevron-right" size={20} color="#9CA3AF" />
   </TouchableOpacity>
);

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: "#F9FAFB",
   },
   
   /* Header Dramático */
   header: {
      backgroundColor: "#E68059",
      paddingTop: 50,
      paddingBottom: 80,
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
   imageContainer: {
      position: "relative",
      width: 120,
      height: 120,
   },
   profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 4,
      borderColor: "#fff",
   },
   editButton: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: "#E68059",
      borderRadius: 18,
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: "#fff",
      shadowColor: "#E68059",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
   },
   
   /* Tarjeta de Información */
   infoCard: {
      backgroundColor: "#fff",
      marginTop: -50,
      marginHorizontal: 20,
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 2,
   },
   infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
   },
   infoTextContainer: {
      flex: 1,
   },
   infoLabel: {
      fontSize: 12,
      color: "#6B7280",
      fontWeight: "600",
      marginBottom: 4,
   },
   infoValue: {
      fontSize: 16,
      color: "#111827",
      fontWeight: "700",
   },
   infoDivider: {
      height: 1,
      backgroundColor: "#F3F4F6",
      marginVertical: 16,
   },
   
   /* Contenido */
   scrollContent: {
      flex: 1,
      paddingHorizontal: 20,
      marginTop: 20,
   },
   sectionTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: "#111827",
      marginBottom: 16,
      marginTop: 10,
   },
   
   /* Opciones */
   option: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      padding: 16,
      borderRadius: 14,
      marginBottom: 12,
      gap: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
   },
   optionIconBg: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#FFF7ED",
      justifyContent: "center",
      alignItems: "center",
   },
   optionContent: {
      flex: 1,
   },
   optionText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#111827",
      marginBottom: 2,
   },
   optionDescription: {
      fontSize: 13,
      color: "#6B7280",
      fontWeight: "600",
   },
   
   /* Botón de Logout */
   logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 20,
      padding: 16,
      backgroundColor: "#FEF2F2",
      borderWidth: 2,
      borderColor: "#FEE2E2",
      borderRadius: 14,
      shadowColor: "#DC2626",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
   },
   logoutText: {
      color: "#DC2626",
      fontWeight: "800",
      fontSize: 16,
   },
});
