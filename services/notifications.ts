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
   let token;

   if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
         name: "default",
         importance: Notifications.AndroidImportance.MAX,
         vibrationPattern: [0, 250, 250, 250],
         lightColor: "#FF231F7C",
      });
   }

   if (Device.isDevice) {
      const { status: existingStatus } =
         await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
         const { status } = await Notifications.requestPermissionsAsync();
         finalStatus = status;
      }

      if (finalStatus !== "granted") {
         alert(
            "No se pudo obtener el permiso para notificaciones. Por favor, activa las notificaciones en la configuración de tu dispositivo."
         );
         return;
      }

      token = (
         await Notifications.getExpoPushTokenAsync({
            projectId: "327e210d-776c-4591-89e8-538b2839329b", // Reemplazar con tu project ID de Expo
         })
      ).data;
      console.log("Push Token:", token);
   } else {
      console.log("Debe usar un dispositivo físico para Push Notifications");
   }

   return token;
}

/**
 * Guardar el token de push notification en Firestore
 */
export async function savePushToken(token: string) {
   const user = auth.currentUser;
   if (!user) {
      console.log("Usuario no autenticado");
      return;
   }

   try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
         userRef,
         {
            pushToken: token,
            lastTokenUpdate: new Date(),
         },
         { merge: true }
      );
      console.log("Token guardado exitosamente");
   } catch (error) {
      console.error("Error al guardar el token:", error);
   }
}

/**
 * Inicializar el servicio de notificaciones
 * Llamar al inicio de la app
 */
export async function initializeNotifications() {
   const token = await registerForPushNotificationsAsync();
   if (token) {
      await savePushToken(token);
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
