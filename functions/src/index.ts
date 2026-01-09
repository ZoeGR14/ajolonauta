import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

// Inicializar Firebase Admin
admin.initializeApp();

const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

// Interfaz para el Reporte
interface Reporte {
   usuario: string;
   userId: string;
   texto: string;
   timestamp: number;
   hora: string;
   fecha: string;
   horaFormato: string;
   estacion: string;
   linea: string;
}

// Interfaz para el documento de estación
interface EstacionDoc {
   estacionId: string;
   estacion: string;
   linea: string;
   comentarios: Reporte[];
   estadoCerrada: boolean;
   fechaCierre?: number;
   ultimaActualizacion: admin.firestore.Timestamp;
   totalReportes: number[];
   fechaCreacion: admin.firestore.Timestamp;
}

/**
 * Función que se ejecuta cuando se actualiza un documento en la colección 'estaciones'
 * Detecta si una estación debe marcarse como cerrada basándose en la cantidad de reportes
 * en los últimos 15 minutos.
 */
export const detectarEstacionCerrada = onDocumentUpdated(
   "estaciones/{estacionId}",
   async (event) => {
      try {
         const estacionId = event.params.estacionId;

         if (!event.data) {
            logger.warn("No hay datos en el evento");
            return null;
         }

         const dataDespues = event.data.after.data() as EstacionDoc;

         if (!dataDespues) {
            logger.warn(`No hay datos para la estación ${estacionId}`);
            return null;
         }

         logger.info(`Revisando estación: ${estacionId}`);

         // Si ya está cerrada, no hacer nada
         if (dataDespues.estadoCerrada) {
            logger.info(
               `La estación ${estacionId} ya está marcada como cerrada`
            );
            return null;
         }

         // Obtener timestamp actual
         const ahora = Date.now();
         // Ventana de tiempo: últimos 15 minutos (en milisegundos)
         const ventanaTiempo = 15 * 60 * 1000;
         const tiempoMinimo = ahora - ventanaTiempo;

         // Filtrar reportes de los últimos 15 minutos
         const reportesRecientes = dataDespues.comentarios.filter(
            (reporte) => reporte.timestamp >= tiempoMinimo
         );

         logger.info(
            `Reportes en los últimos 15 minutos: ${reportesRecientes.length}`
         );

         // Umbral: 5 o más reportes
         const UMBRAL_REPORTES = 5;

         if (reportesRecientes.length >= UMBRAL_REPORTES) {
            logger.info(
               `¡Umbral alcanzado! Marcando estación ${estacionId} como cerrada`
            );

            // Actualizar documento en 'estaciones'
            await event.data.after.ref.update({
               estadoCerrada: true,
               fechaCierre: ahora,
               ultimaActualizacion:
                  admin.firestore.FieldValue.serverTimestamp(),
            });

            // Crear documento en 'estaciones_cerradas' usando el nombre de la estación
            const estacionCerradaDoc = {
               razon: "Alta actividad de reportes",
            };

            await db
               .collection("estaciones_cerradas")
               .doc(dataDespues.estacion)
               .set(estacionCerradaDoc);

            logger.info(
               `Estación ${dataDespues.estacion} (${dataDespues.linea}) marcada como cerrada`
            );
            logger.info(`Reportes detectados: ${reportesRecientes.length}`);
            logger.info(`Documento creado en estaciones_cerradas`);

            return {
               success: true,
               estacion: dataDespues.estacion,
               linea: dataDespues.linea,
               reportes: reportesRecientes.length,
            };
         } else {
            logger.info(
               `Umbral no alcanzado (${reportesRecientes.length}/${UMBRAL_REPORTES})`
            );
            return null;
         }
      } catch (error) {
         logger.error("Error en detectarEstacionCerrada:", error);
         throw error;
      }
   }
);
