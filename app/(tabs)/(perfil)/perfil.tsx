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
         <View style={styles.profileWrapper}>
            <View style={styles.imageContainer}>
               <Image source={{ uri: image }} style={styles.profileImage} />
               <TouchableOpacity style={styles.editButton} onPress={pickImage}>
                  <Feather name="edit" size={20} color="#e68059" />
               </TouchableOpacity>
            </View>
            <Text style={styles.name}>{username}</Text>
            <Text style={styles.email}>{email}</Text>
         </View>

         <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Option
               icon="heart"
               label="Rutas guardadas"
               onPress={() => router.push("./rutasGuardadas")}
            />
            <Option
               icon="settings"
               label="Modificar datos"
               onPress={() => router.push("./configuracion")}
            />
            <TouchableOpacity
               style={styles.logoutButton}
               onPress={handleLogout}
            >
               <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
         </ScrollView>
      </View>
   );
}

const Option = ({
   icon,
   label,
   onPress,
}: {
   icon: string;
   label: string;
   onPress?: () => void;
}) => (
   <TouchableOpacity style={styles.option} onPress={onPress}>
      <View style={styles.optionLeft}>
         <Feather name={icon as any} size={24} color="#e68059" />
         <Text style={styles.optionText}>{label}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#ccc" />
   </TouchableOpacity>
);

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: "#fff",
      paddingTop: 60,
      paddingHorizontal: 20,
   },
   name: {
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 10,
   },
   email: {
      fontSize: 14,
      color: "gray",
   },
   option: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: "#fffbf6",
      padding: 15,
      borderRadius: 12,
      marginBottom: 15,
      alignItems: "center",
   },
   optionLeft: {
      flexDirection: "row",
      alignItems: "center",
   },
   optionText: {
      marginLeft: 15,
      fontSize: 16,
   },
   logoutButton: {
      marginTop: 30,
      padding: 15,
      borderColor: "red",
      borderWidth: 1,
      borderRadius: 12,
      alignItems: "center",
   },
   logoutText: {
      color: "red",
      fontWeight: "bold",
      fontSize: 16,
   },
   profileWrapper: {
      alignItems: "center",
      marginTop: 20,
      marginBottom: 20,
   },
   imageContainer: {
      position: "relative",
      width: 160,
      height: 160,
   },
   profileImage: {
      width: 160,
      height: 160,
      borderRadius: 80,
   },
   editButton: {
      position: "absolute",
      bottom: 3,
      right: 15,
      backgroundColor: "white",
      borderRadius: 20,
      padding: 6,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
   },
});
