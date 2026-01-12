import { initializeNotifications } from "@/services/notifications";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";
import {
   ActivityIndicator,
   Alert,
   Modal,
   ScrollView,
   StyleSheet,
   Text,
   TextInput,
   TouchableOpacity,
   View,
} from "react-native";
import { auth, db } from "../../FirebaseConfig";

export default function LoginScreen() {
   const router = useRouter();
   const [loginInput, setLoginInput] = useState("");
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [loading, setLoading] = useState(false);

   const getEmailFromUsername = async (username: string) => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
         return querySnapshot.docs[0].data().email;
      }
      return null;
   };

   const handleLogin = async () => {
      try {
         setLoading(true);
         let email = loginInput;

         // Si el input no contiene @, buscar el email del username
         if (!email.includes("@")) {
            const foundEmail = await getEmailFromUsername(loginInput);
            if (!foundEmail) {
               Alert.alert("Error", "Nombre de usuario no encontrado.");
               setLoading(false);
               return;
            }
            email = foundEmail;
         }

         // Intentar iniciar sesión con el email
         const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
         );

         console.log("✅ Login exitoso, usuario:", userCredential.user.uid);
         console.log("🔔 Registrando notificaciones...");

         // Registrar el dispositivo para notificaciones después del login
         await initializeNotifications();
         console.log("✅ Notificaciones inicializadas");

         // No navegamos aquí, el onAuthStateChanged en index.tsx se encargará
      } catch (error: any) {
         console.error("❌ Error en login:", error);
         Alert.alert(
            "Error",
            "Credenciales incorrectas o problema de conexión."
         );
      } finally {
         setLoading(false);
      }
   };

   return (
      <>
         <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
         >
            <View style={styles.card}>
               <Text style={styles.title}>Iniciar Sesión</Text>

               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Correo o Nombre de Usuario</Text>
                  <TextInput
                     placeholder="Ingresa tu correo o usuario"
                     value={loginInput}
                     onChangeText={setLoginInput}
                     autoCapitalize="none"
                     style={styles.input}
                     editable={!loading}
                  />
               </View>

               <View style={styles.inputGroup}>
                  <Text style={styles.label}>Contraseña</Text>
                  <View style={styles.passwordContainer}>
                     <TextInput
                        placeholder="Ingresa tu contraseña"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        style={styles.inputPassword}
                        editable={!loading}
                     />
                     <TouchableOpacity
                        onPress={() => {
                           setShowPassword(!showPassword);
                        }}
                        style={styles.eye}
                        disabled={loading}
                     >
                        <Text>{showPassword ? "🙈" : "👁️"}</Text>
                     </TouchableOpacity>
                  </View>
               </View>

               <TouchableOpacity
                  style={styles.button}
                  onPress={handleLogin}
                  disabled={loading}
               >
                  <Text style={styles.buttonText}>Ingresar</Text>
               </TouchableOpacity>

               <TouchableOpacity
                  onPress={() => router.push("/forgot-pass")}
                  style={styles.linkContainer}
                  disabled={loading}
               >
                  <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
               </TouchableOpacity>

               <View style={styles.footer}>
                  <Text style={{ color: "#555" }}>¿Aún no tienes cuenta?</Text>
                  <TouchableOpacity
                     onPress={() => router.push("/signup")}
                     disabled={loading}
                  >
                     <Text style={styles.link}> Regístrate</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </ScrollView>

         {/* Loader con fondo oscuro tipo modal */}
         <Modal transparent animationType="fade" visible={loading}>
            <View style={styles.loaderContainer}>
               <ActivityIndicator size="large" color="#fff" />
               <Text style={styles.loaderText}>Iniciando sesión...</Text>
            </View>
         </Modal>
      </>
   );
}

const styles = StyleSheet.create({
   container: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: "#fefefe",
   },
   card: {
      backgroundColor: "white",
      borderRadius: 16,
      padding: 25,
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 10,
   },
   title: {
      fontSize: 26,
      fontWeight: "bold",
      marginBottom: 30,
      color: "#e68059",
      textAlign: "center",
   },
   inputGroup: {
      marginBottom: 18,
   },
   label: {
      marginBottom: 5,
      color: "#333",
      fontWeight: "500",
   },
   input: {
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 10,
      height: 50,
      paddingHorizontal: 15,
      backgroundColor: "#f9f9f9",
   },
   passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 10,
      backgroundColor: "#f9f9f9",
   },
   inputPassword: {
      flex: 1,
      height: 50,
      paddingHorizontal: 15,
      color: "black",
   },
   eye: {
      padding: 10,
   },
   button: {
      backgroundColor: "#e68059",
      borderRadius: 10,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 10,
   },
   buttonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 16,
   },
   linkContainer: {
      alignItems: "center",
      marginVertical: 15,
   },
   linkText: {
      color: "#e68059",
      fontWeight: "bold",
   },
   footer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 5,
   },
   link: {
      color: "#e68059",
      fontWeight: "bold",
   },
   loaderContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
   },
   loaderText: {
      marginTop: 10,
      color: "#fff",
      fontWeight: "bold",
   },
});
