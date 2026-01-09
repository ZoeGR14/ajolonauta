import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

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

         const dataAntes = event.data.before.data() as EstacionDoc | undefined;
         const dataDespues = event.data.after.data() as EstacionDoc;

         if (!dataDespues) {
            logger.warn(`No hay datos para la estación ${estacionId}`);
            return null;
         }

         logger.info(`Revisando estación: ${estacionId}`);

         // Si la estación acaba de ser reabierta (de cerrada a abierta), no hacer nada
         if (dataAntes?.estadoCerrada && !dataDespues.estadoCerrada) {
            logger.info(
               `La estación ${estacionId} acaba de ser reabierta, omitiendo verificación`
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

         // Si ya está cerrada, solo actualizar el contador de reportes
         if (dataDespues.estadoCerrada) {
            logger.info(
               `La estación ${estacionId} ya está cerrada, actualizando contador`
            );

            if (reportesRecientes.length >= UMBRAL_REPORTES) {
               // Actualizar el contador en estaciones_cerradas
               await db
                  .collection("estaciones_cerradas")
                  .doc(dataDespues.estacionId)
                  .update({
                     cantidadReportes: reportesRecientes.length,
                  });

               logger.info(
                  `Contador actualizado: ${reportesRecientes.length} reportes`
               );
            }

            return null;
         }

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

            // Crear documento en 'estaciones_cerradas' usando el estacionId
            const estacionCerradaDoc = {
               razon: "Alta actividad de reportes",
               cantidadReportes: reportesRecientes.length,
            };

            await db
               .collection("estaciones_cerradas")
               .doc(dataDespues.estacionId)
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

/**
 * Función programada que se ejecuta cada 6 horas
 * Revisa las estaciones cerradas y reabre aquellas que no han recibido reportes
 * en los últimos 15 minutos.
 */
export const reabrirEstacionesInactivas = onSchedule(
   //cambiar en deploy
   "every 6 hours",
   async (event) => {
      try {
         logger.info("Iniciando revisión de estaciones cerradas...");

         const ahora = Date.now();
         // Tiempo de inactividad: 15 minutos (en milisegundos)
         const TIEMPO_INACTIVIDAD = 15 * 60 * 1000;

         // Obtener todas las estaciones cerradas
         const estacionesCerradasSnapshot = await db
            .collection("estaciones_cerradas")
            .where("razon", "==", "Alta actividad de reportes")
            .get();

         if (estacionesCerradasSnapshot.empty) {
            logger.info("No hay estaciones cerradas para revisar");
            return;
         }

         logger.info(
            `Revisando ${estacionesCerradasSnapshot.size} estaciones cerradas`
         );

         const batch = db.batch();
         let estacionesReabiertas = 0;

         for (const docCerrada of estacionesCerradasSnapshot.docs) {
            const estacionId = docCerrada.id;

            // Buscar la estación en la colección 'estaciones'
            const estacionRef = db.collection("estaciones").doc(estacionId);
            const estacionDoc = await estacionRef.get();

            if (!estacionDoc.exists) {
               logger.warn(
                  `Estación ${estacionId} no encontrada en colección estaciones`
               );
               continue;
            }

            const estacionData = estacionDoc.data() as EstacionDoc;

            if (!estacionData.estadoCerrada) {
               // Si ya está abierta, eliminar de estaciones_cerradas
               batch.delete(docCerrada.ref);
               estacionesReabiertas++;
               logger.info(
                  `Estación ${estacionId} ya estaba abierta, eliminando registro`
               );
               continue;
            }

            // Buscar el reporte más reciente
            const reportesOrdenados = estacionData.comentarios
               .filter((r) => r.timestamp)
               .sort((a, b) => b.timestamp - a.timestamp);

            if (reportesOrdenados.length === 0) {
               // No hay reportes, reabrir estación
               batch.update(estacionRef, {
                  estadoCerrada: false,
                  ultimaActualizacion:
                     admin.firestore.FieldValue.serverTimestamp(),
               });
               batch.delete(docCerrada.ref);
               estacionesReabiertas++;
               logger.info(`Estación ${estacionId} reabierta (sin reportes)`);
               continue;
            }

            const ultimoReporte = reportesOrdenados[0];
            const tiempoDesdeUltimoReporte = ahora - ultimoReporte.timestamp;

            if (tiempoDesdeUltimoReporte >= TIEMPO_INACTIVIDAD) {
               // Reabrir estación
               batch.update(estacionRef, {
                  estadoCerrada: false,
                  ultimaActualizacion:
                     admin.firestore.FieldValue.serverTimestamp(),
               });
               batch.delete(docCerrada.ref);
               estacionesReabiertas++;
               logger.info(
                  `Estación ${estacionId} reabierta (${Math.round(
                     tiempoDesdeUltimoReporte / 60000
                  )} minutos sin reportes)`
               );
            } else {
               logger.info(
                  `Estación ${estacionId} sigue activa (último reporte hace ${Math.round(
                     tiempoDesdeUltimoReporte / 60000
                  )} minutos)`
               );
            }
         }

         // Ejecutar todas las operaciones en batch
         if (estacionesReabiertas > 0) {
            await batch.commit();
            logger.info(
               `✅ Total de estaciones reabiertas: ${estacionesReabiertas}`
            );
         } else {
            logger.info("No hay estaciones para reabrir en este momento");
         }
      } catch (error) {
         logger.error("Error en reabrirEstacionesInactivas:", error);
         throw error;
      }
   }
);
