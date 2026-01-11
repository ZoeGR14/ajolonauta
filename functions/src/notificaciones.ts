/**
 * Función para enviar notificaciones push cuando una estación se cierra
 * y afecta a rutas guardadas de usuarios
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

interface RutaGuardada {
   start: string;
   end: string;
   userId: string;
   path?: string[]; // Array de nombres de estaciones en la ruta
}

interface Usuario {
   pushToken?: string;
}

/**
 * Envía notificaciones push a los usuarios afectados por el cierre de una estación
 * @param estacionId - ID de la estación cerrada (formato: "NombreEstacion - Línea X")
 * @param razon - Razón del cierre
 */
export async function notificarUsuariosAfectados(
   estacionId: string,
   razon: string
) {
   try {
      logger.info(`Buscando usuarios afectados por cierre de ${estacionId}`);

      // Obtener instancia de Firestore
      const db = admin.firestore();

      // 1. Obtener todas las rutas guardadas
      const rutasSnapshot = await db.collection("rutas_guardadas").get();

      if (rutasSnapshot.empty) {
         logger.info("No hay rutas guardadas en el sistema");
         return;
      }

      // 2. Encontrar rutas que contengan la estación cerrada
      const usuariosAfectados = new Set<string>();
      const nombreEstacion = estacionId.split(" - ")[0]; // Extraer nombre sin línea

      for (const rutaDoc of rutasSnapshot.docs) {
         const ruta = rutaDoc.data() as RutaGuardada;

         // Verificar si la estación está en el path guardado
         // Buscar tanto por ID completo como por nombre de estación
         const estaEnRuta =
            ruta.path?.includes(estacionId) ||
            ruta.path?.some((estacion) => estacion === nombreEstacion) ||
            ruta.start === estacionId ||
            ruta.end === estacionId;

         if (estaEnRuta) {
            usuariosAfectados.add(ruta.userId);
            logger.info(
               `Usuario ${ruta.userId} afectado: ruta ${ruta.start} -> ${ruta.end} contiene ${estacionId}`
            );
         }
      }

      if (usuariosAfectados.size === 0) {
         logger.info("No hay usuarios afectados por este cierre");
         return;
      }

      // 3. Obtener tokens de push de los usuarios afectados
      const tokens: string[] = [];
      for (const userId of usuariosAfectados) {
         const userDoc = await db.collection("users").doc(userId).get();
         if (userDoc.exists) {
            const userData = userDoc.data() as Usuario;
            if (userData.pushToken) {
               tokens.push(userData.pushToken);
            }
         }
      }

      if (tokens.length === 0) {
         logger.info("Ningún usuario afectado tiene token de notificación");
         return;
      }

      // 4. Preparar el mensaje de notificación
      const nombreEstacionNot = estacionId.split(" - ")[0];
      let titulo = "";
      let cuerpo = "";

      if (razon === "Alta actividad de reportes") {
         titulo = "⚠️ Problemas en tu Ruta";
         cuerpo = `La estación ${nombreEstacionNot} tiene alta demanda de reportes. Considera usar una ruta alternativa.`;
      } else {
         titulo = "🚫 Estación Cerrada en tu Ruta";
         cuerpo = `La estación ${nombreEstacionNot} está cerrada. Revisa tu ruta guardada para encontrar alternativas.`;
      }

      // 5. Enviar notificaciones usando Expo Push Notification API
      const messages = tokens.map((token) => ({
         to: token,
         sound: "default",
         title: titulo,
         body: cuerpo,
         data: { estacionId, razon },
         priority: "high",
         channelId: "default",
      }));

      // Enviar notificaciones en lotes de 100 (límite de Expo)
      const batchSize = 100;
      for (let i = 0; i < messages.length; i += batchSize) {
         const batch = messages.slice(i, i + batchSize);

         const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
               Accept: "application/json",
               "Content-Type": "application/json",
            },
            body: JSON.stringify(batch),
         });

         const result = await response.json();
         logger.info(`Notificaciones enviadas:`, result);
      }

      logger.info(
         `Se enviaron ${tokens.length} notificaciones por cierre de ${estacionId}`
      );
      return { success: true, notificacionesEnviadas: tokens.length };
   } catch (error) {
      logger.error("Error al enviar notificaciones:", error);
      throw error;
   }
}
