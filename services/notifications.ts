import { auth, db } from "@/FirebaseConfig";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { doc, setDoc } from "firebase/firestore";
import { Platform } from "react-native";

// Configurar cómo se manejan las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
   handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
   }),
});

/**
 * Registrar el dispositivo para recibir push notifications
 * Retorna el token de Expo Push Notification
 */
export async function registerForPushNotificationsAsync(): Promise<
   string | undefined
> {
   console.log("🔔 Iniciando registerForPushNotificationsAsync");
   let token;

   if (Platform.OS === "android") {
      console.log("📱 Configurando canal de notificaciones para Android");
      await Notifications.setNotificationChannelAsync("default", {
         name: "default",
         importance: Notifications.AndroidImportance.MAX,
         vibrationPattern: [0, 250, 250, 250],
         lightColor: "#FF231F7C",
      });
   }

   if (Device.isDevice) {
      console.log("✅ Dispositivo físico detectado");
      const { status: existingStatus } =
         await Notifications.getPermissionsAsync();
      console.log("Estado de permisos actual:", existingStatus);
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
         console.log("⚠️ Solicitando permisos de notificación...");
         const { status } = await Notifications.requestPermissionsAsync();
         finalStatus = status;
         console.log("Estado de permisos después de solicitar:", finalStatus);
      }

      if (finalStatus !== "granted") {
         console.log("❌ Permisos denegados");
         alert(
            "No se pudo obtener el permiso para notificaciones. Por favor, activa las notificaciones en la configuración de tu dispositivo."
         );
         return;
      }

      console.log("🎫 Obteniendo token de Expo...");
      token = (
         await Notifications.getExpoPushTokenAsync({
            projectId: "327e210d-776c-4591-89e8-538b2839329b",
         })
      ).data;
      console.log("✅ Push Token obtenido:", token);
   } else {
      console.log("❌ No es dispositivo físico");
      console.log("Debe usar un dispositivo físico para Push Notifications");
   }

   return token;
}

/**
 * Guardar el token de push notification en Firestore
 */
export async function savePushToken(token: string) {
   console.log("=== INICIANDO savePushToken ===");
   console.log("Token recibido:", token);

   const user = auth.currentUser;
   console.log("Usuario actual:", user?.uid);

   if (!user) {
      console.log("❌ Usuario no autenticado");
      return;
   }

   try {
      console.log("Intentando guardar en users/" + user.uid);
      const userRef = doc(db, "users", user.uid);

      // Siempre usar set con merge para crear o actualizar
      await setDoc(
         userRef,
         {
            pushToken: token,
            lastTokenUpdate: new Date(),
         },
         { merge: true }
      );
      console.log("✅ Token guardado exitosamente en Firestore");
   } catch (error: any) {
      console.error("❌ Error al guardar el token:", error.message);
      console.error("Código de error:", error.code);
      console.error("Error completo:", error);
   }
}

/**
 * Inicializar el servicio de notificaciones
 * Llamar al inicio de la app
 */
export async function initializeNotifications() {
   console.log("🚀 INICIANDO initializeNotifications");
   try {
      const token = await registerForPushNotificationsAsync();
      console.log("Token obtenido en initializeNotifications:", token);

      if (token) {
         await savePushToken(token);
      } else {
         console.log("⚠️ No se obtuvo token");
      }
   } catch (error: any) {
      console.error("❌ Error en initializeNotifications:", error.message);
      console.error("Error completo:", error);
   }

   // Listener para cuando se recibe una notificación mientras la app está abierta
   const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
         console.log("Notificación recibida:", notification);
      }
   );

   // Listener para cuando el usuario toca una notificación
   const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
         console.log("Notificación tocada:", response);
         // Aquí puedes navegar a una pantalla específica según la notificación
      });

   return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
   };
}
