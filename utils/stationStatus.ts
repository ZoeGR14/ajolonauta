import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/FirebaseConfig";

/**
 * Verifica el estado de una estación
 */
export const checkStationStatus = async (estacionId: string) => {
  try {
    // Verificar en tabla de estaciones cerradas
    const closedRef = doc(db, "estaciones_cerradas", estacionId);
    const closedSnap = await getDoc(closedRef);

    if (closedSnap.exists()) {
      const data = closedSnap.data();
      // Verificar si el cierre fue hace menos de 2 horas
      const dosHorasEnMs = 2 * 60 * 60 * 1000;
      const ahora = Date.now();

      if (data.fechaCierre && ahora - data.fechaCierre < dosHorasEnMs) {
        return {
          cerrada: true,
          razon: data.razon,
          fechaCierre: data.fechaCierreFormato,
          cantidadReportes: data.cantidadReportes,
        };
      }
    }

    // Si no está cerrada o pasaron más de 2 horas
    return {
      cerrada: false,
      razon: null,
      fechaCierre: null,
      cantidadReportes: 0,
    };
  } catch (error) {
    console.error("Error al verificar estado de estación:", error);
    return {
      cerrada: false,
      razon: null,
      fechaCierre: null,
      cantidadReportes: 0,
    };
  }
};

/**
 * Obtiene todas las estaciones cerradas actualmente
 */
export const getClosedStations = async () => {
  try {
    const closedCollection = collection(db, "estaciones_cerradas");
    const snapshot = await getDocs(closedCollection);

    const dosHorasEnMs = 2 * 60 * 60 * 1000;
    const ahora = Date.now();

    const estacionesCerradas: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Solo incluir cierres recientes (menos de 2 horas)
      if (data.fechaCierre && ahora - data.fechaCierre < dosHorasEnMs) {
        estacionesCerradas.push({
          id: doc.id,
          ...data,
        });
      }
    });

    return estacionesCerradas;
  } catch (error) {
    console.error("Error al obtener estaciones cerradas:", error);
    return [];
  }
};

/**
 * Formatea el tiempo transcurrido desde el cierre
 */
export const formatTimeSinceClosed = (fechaCierre: number) => {
  const ahora = Date.now();
  const diferencia = ahora - fechaCierre;

  const minutos = Math.floor(diferencia / (60 * 1000));
  const horas = Math.floor(diferencia / (60 * 60 * 1000));

  if (minutos < 60) {
    return `Hace ${minutos} minuto${minutos !== 1 ? "s" : ""}`;
  } else {
    return `Hace ${horas} hora${horas !== 1 ? "s" : ""}`;
  }
};
