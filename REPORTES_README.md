# 📊 Sistema de Reportes Mejorado - Documentación

## 🎯 Descripción General

El sistema de reportes ha sido completamente mejorado para incluir detección automática de estaciones cerradas basado en alta actividad de reportes.

---

## 📋 Estructura de Datos Mejorada

### **Formato de Reporte (Comentario)**

Cada reporte ahora incluye la siguiente estructura en Firestore:

```typescript
{
  usuario: string,           // Nombre del usuario
  userId: string,            // ID único del usuario
  texto: string,             // Contenido del reporte
  timestamp: number,         // Timestamp numérico (milisegundos) para cálculos
  hora: string,              // "08/01/2026, 10:30:45 AM"
  fecha: string,             // "08/01/2026"
  horaFormato: string,       // "10:30:45 AM"
  estacion: string,          // Nombre de la estación
  linea: string              // "Línea 1", "Línea 2", etc.
}
```

### **Colección: `estaciones`**

```typescript
{
  estacionId: string,                    // "Zócalo - Línea 2"
  estacion: string,                      // "Zócalo"
  linea: string,                         // "Línea 2"
  comentarios: Array<Reporte>,           // Array de reportes
  estadoCerrada: boolean,                // true si está cerrada
  fechaCierre: number,                   // Timestamp del cierre
  ultimaActualizacion: Timestamp,        // Firestore serverTimestamp()
  totalReportes: Array<number>,          // Array de timestamps para estadísticas
  fechaCreacion: Timestamp               // Fecha de creación del documento
}
```

### **Colección: `estaciones_cerradas`**

```typescript
{
  estacionId: string,                    // "Zócalo - Línea 2"
  estacion: string,                      // "Zócalo"
  linea: string,                         // "Línea 2"
  estado: "cerrada",                     // Estado fijo
  razon: string,                         // "Alta actividad de reportes"
  cantidadReportes: number,              // Número de reportes que causaron el cierre
  reportesRecientes: Array<Reporte>,     // Últimos 10 reportes
  fechaCierre: number,                   // Timestamp numérico del cierre
  fechaCierreFormato: string,            // Formato legible del cierre
  timestampServidor: Timestamp           // Firestore serverTimestamp()
}
```

---

## ⚙️ Funcionalidad de Detección

### **Lógica de Detección**

El sistema detecta automáticamente cuando una estación debe marcarse como cerrada:

1. **Trigger**: Después de cada nuevo reporte
2. **Ventana de tiempo**: Últimos 15 minutos
3. **Umbral**: 5 o más reportes
4. **Acción**: Marca la estación como cerrada y crea registro en `estaciones_cerradas`

### **Código de Detección**

```typescript
// Verifica reportes recientes
const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
const recentReports = comentarios.filter((comment) => {
  return comment.timestamp && comment.timestamp >= fifteenMinutesAgo;
});

// Si hay 5+ reportes, marcar como cerrada
if (recentReports.length >= 5) {
  await markStationAsClosed(estacionId, recentReports);
}
```

---

## 🔧 Funciones Auxiliares

### **`checkStationStatus(estacionId: string)`**

Verifica el estado actual de una estación.

**Retorna:**

```typescript
{
  cerrada: boolean,
  razon: string | null,
  fechaCierre: string | null,
  cantidadReportes: number
}
```

**Características:**

- Verifica en la colección `estaciones_cerradas`
- Solo considera cierres de las últimas 2 horas como activos
- Después de 2 horas, la estación se considera "reabierta"

### **`getClosedStations()`**

Obtiene todas las estaciones cerradas actualmente.

**Retorna:**

```typescript
Array<{
  id: string;
  estacionId: string;
  estacion: string;
  linea: string;
  fechaCierre: number;
  cantidadReportes: number;
  // ... más campos
}>;
```

### **`formatTimeSinceClosed(fechaCierre: number)`**

Formatea el tiempo transcurrido desde el cierre.

**Ejemplos:**

- "Hace 5 minutos"
- "Hace 1 hora"
- "Hace 2 horas"

---

## 🎨 Interfaz de Usuario

### **Alertas Visuales**

Cuando una estación está cerrada, se muestra una alerta roja prominente:

```
┌─────────────────────────────────────┐
│ ⚠️  ESTACIÓN CERRADA                │
│                                     │
│ Esta estación ha sido marcada como  │
│ cerrada por alta actividad de       │
│ reportes                            │
│                                     │
│ [⏰ Hace 12 minutos] [⚠️ 7+ reportes]│
└─────────────────────────────────────┘
```

### **Flujo al Crear Reporte**

1. Usuario escribe y envía reporte
2. Sistema guarda con formato mejorado
3. Sistema verifica reportes recientes (últimos 15 min)
4. Si ≥5 reportes:
   - Marca estación como cerrada
   - Guarda en `estaciones_cerradas`
   - Muestra alerta especial al usuario
5. Si <5 reportes:
   - Muestra confirmación normal

---

## 📱 Archivos Modificados

### **1. `crearAviso.tsx`**

- ✅ Formato mejorado de reportes con timestamp
- ✅ Función `checkRecentReports()`
- ✅ Función `markStationAsClosed()`
- ✅ Alertas diferenciadas según estado

### **2. `leerAvisos.tsx`**

- ✅ Verificación de estado al cargar
- ✅ Componente visual de alerta cerrada
- ✅ Estilos para alerta roja

### **3. `index.tsx`**

- ✅ Misma verificación y alertas
- ✅ Consistencia visual en toda la app

### **4. `utils/stationStatus.ts` (NUEVO)**

- ✅ Funciones reutilizables
- ✅ Lógica centralizada
- ✅ Fácil de mantener

---

## 🚀 Ventajas del Nuevo Sistema

### **Para Usuarios**

- ⚡ Detección automática de problemas
- 🎯 Alertas visuales claras
- 📊 Información en tiempo real
- 🔔 Notificación de cierre inmediata

### **Para Desarrolladores**

- 📝 Datos estructurados y tipados
- 🔍 Timestamps numéricos para cálculos fáciles
- 📊 Metadatos completos para análisis
- 🧹 Código limpio y modular
- 🔄 Funciones reutilizables

### **Para Administradores**

- 📈 Estadísticas precisas
- 🕐 Historial completo
- 🔍 Fácil auditoría
- 📊 Reportes detallados

---

## 🔮 Futuras Mejoras Sugeridas

1. **Push Notifications**: Notificar usuarios cuando su estación se cierra
2. **Dashboard Admin**: Panel para gestionar estaciones cerradas manualmente
3. **Análisis de Patrones**: Machine learning para predecir cierres
4. **Geolocalización**: Auto-detectar estación del usuario
5. **Integración API**: Datos oficiales del Metro
6. **Votación de Reportes**: Sistema de upvote/downvote
7. **Categorías**: Tipos de problemas (mantenimiento, seguridad, etc.)
8. **Resolución**: Marcar cuando el problema se resuelve

---

## 🛠️ Mantenimiento

### **Limpieza de Datos**

Considera implementar una Cloud Function para:

- Eliminar reportes antiguos (>7 días)
- Limpiar estaciones cerradas obsoletas (>2 horas)
- Optimizar índices de Firestore

### **Monitoreo**

Métricas importantes a monitorear:

- Cantidad de reportes por hora
- Frecuencia de cierres por estación
- Tiempo promedio de cierre
- Usuarios más activos

---

## 📞 Soporte

Para dudas o mejoras, contactar al equipo de desarrollo.

**Última actualización**: 8 de enero de 2026
**Versión**: 2.0.0
**Autor**: Sistema de Reportes Ajolonauta
