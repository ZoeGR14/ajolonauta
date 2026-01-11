# Cloud Functions - Sistema de Detección y Gestión de Estaciones

## 📋 Descripción

Sistema automatizado de Cloud Functions que detecta estaciones con alta actividad de reportes, las marca como cerradas temporalmente y las reabre automáticamente cuando la actividad disminuye.

## ⚙️ Funcionalidades

### 1. `detectarEstacionCerrada`

**Trigger**: Se ejecuta automáticamente cuando se actualiza un documento en la colección `estaciones`

**Lógica**:

1. **Ventana de tiempo**: Últimos 15 minutos
2. **Umbral**: 5 o más reportes
3. **Actualización dinámica**: Actualiza el contador de reportes incluso si ya está cerrada
4. **Prevención de recierre**: No vuelve a cerrar estaciones recién reabiertas

**Acciones**:

-  Marca la estación como cerrada (`estadoCerrada: true`)
-  Registra el timestamp del cierre
-  Crea documento en `estaciones_cerradas` con ID completo (ej: "Zócalo - Línea 2")
-  Actualiza `cantidadReportes` en tiempo real mientras permanece cerrada

### 2. `reabrirEstacionesInactivas`

**Trigger**: Se ejecuta automáticamente cada 15 minutos (función programada)

**Lógica**:

1. **Tiempo de inactividad**: 15 minutos sin reportes nuevos
2. **Filtro**: Solo estaciones cerradas por "Alta actividad de reportes"
3. **Verificación**: Revisa el timestamp del último reporte

**Acciones**:

-  Reabre estaciones sin actividad reciente (`estadoCerrada: false`)
-  Elimina el registro de `estaciones_cerradas`
-  Registra en logs la cantidad de estaciones reabiertas

### Flujo de Ejecución

```
Nuevo reporte → Actualización en estaciones
    ↓
detectarEstacionCerrada (trigger)
    ↓
¿Acaba de ser reabierta?
├─ SÍ → Omitir verificación (prevenir loop)
└─ NO → ¿Ya está cerrada?
    ├─ SÍ → Actualizar contador de reportes
    └─ NO → ¿5+ reportes en 15 min?
        ├─ SÍ → Cerrar estación + Crear registro
        └─ NO → No hacer nada

--- Cada 15 minutos ---

reabrirEstacionesInactivas (scheduled)
    ↓
Revisar estaciones cerradas por "Alta actividad de reportes"
    ↓
¿15+ min sin reportes nuevos?
├─ SÍ → Reabrir estación + Eliminar registro
└─ NO → Mantener cerrada
```

## 🚀 Despliegue

### Pre-requisitos

1. Firebase CLI instalado:

   ```bash
   npm install -g firebase-tools
   ```

2. Autenticación con Firebase:
   ```bash
   firebase login
   ```

### Desplegar Funciones

```bash
# Desplegar todas las funciones
firebase deploy --only functions

# Desplegar función específica
firebase deploy --only functions:detectarEstacionCerrada
firebase deploy --only functions:reabrirEstacionesInactivas
```

## 📊 Logs y Monitoreo

Ver logs en tiempo real:

```bash
firebase functions:log
```

Filtrar por función específica:

```bash
firebase functions:log --only detectarEstacionCerrada
firebase functions:log --only reabrirEstacionesInactivas
```

O en la consola de Firebase:

-  Firebase Console → Functions → Logs

## 🧪 Testing Local

Para probar localmente con el emulador:

```bash
# Instalar dependencias
cd functions
npm install

# Iniciar emulador
npm run serve
```

## 📝 Estructura de Datos

### Documento en `estaciones`

```typescript
{
  estacionId: "Zócalo - Línea 2",
  estacion: "Zócalo",
  linea: "Línea 2",
  comentarios: [
    {
      usuario: "Juan Pérez",
      userId: "uid123",
      texto: "Reportando problema...",
      timestamp: 1704722445000,        // Para cálculos
      hora: "10/01/2026, 10:30:45 AM", // Formato completo
      fecha: "10/01/2026",             // Solo fecha
      horaFormato: "10:30:45 AM",      // Solo hora
      estacion: "Zócalo",
      linea: "Línea 2"
    }
  ],
  estadoCerrada: false,
  fechaCierre?: 1704722445000,
  ultimaActualizacion: Timestamp,
  totalReportes: [1704722445000, ...],
  fechaCreacion: Timestamp
}
```

### Documento en `estaciones_cerradas`

```typescript
{
  // ID del documento: "Zócalo - Línea 2" (con acento en "Línea")
  razon: "Alta actividad de reportes",
  cantidadReportes: 6  // Se actualiza en tiempo real
}
```

## ⚠️ Consideraciones

-  **Costo**: `detectarEstacionCerrada` se ejecuta en cada actualización; `reabrirEstacionesInactivas` cada 15 minutos
-  **Límite**: `maxInstances: 10` para control de costos
-  **Zona horaria**: `America/Mexico_City` para fechas formateadas
-  **Prevención de loops**: Detecta reaberturas para evitar cierres inmediatos
-  **Actualización dinámica**: El contador de reportes se actualiza mientras la estación permanece cerrada

## 🔧 Configuración

### Modificar Parámetros

En [index.ts](src/index.ts):

**Función `detectarEstacionCerrada`**:

```typescript
// Cambiar ventana de tiempo (15 minutos por defecto)
const ventanaTiempo = 15 * 60 * 1000; // milisegundos

// Cambiar umbral de reportes (5 por defecto)
const UMBRAL_REPORTES = 5;
```

**Función `reabrirEstacionesInactivas`**:

```typescript
// Cambiar frecuencia de ejecución
"every 6 hours"; // Opciones: "every X minutes/hours"

// Cambiar tiempo de inactividad (15 minutos por defecto)
const TIEMPO_INACTIVIDAD = 15 * 60 * 1000; // milisegundos
```

## 🎯 Integración con la App

### Comportamiento en la Aplicación

**Estaciones cerradas por "Alta actividad de reportes":**

-  Como **origen/destino**: Muestra toast de advertencia, permite crear ruta
-  Como **intermedia**: Bloqueada en el algoritmo de rutas (busca rutas alternativas)
-  **Contador**: Se actualiza en tiempo real en `estaciones_cerradas`

**Estaciones cerradas por otra razón:**

-  Completamente bloqueadas (origen, destino e intermedia)
-  Muestra alerta y limpia la selección del usuario

## 📌 Características Implementadas

-  ✅ Detección automática de alta actividad de reportes
-  ✅ Cierre y reapertura automática de estaciones
-  ✅ Contador de reportes actualizado en tiempo real
-  ✅ Prevención de loops de cierre/reapertura
-  ✅ Sistema de logs detallado para monitoreo
-  ✅ Ejecución programada cada 6 horas
-  ✅ Integración inteligente con sistema de rutas
-  ✅ Uso de ID completo con acentos ("Línea")

## 🔍 Troubleshooting

**La función no se ejecuta:**

-  Verificar que las APIs necesarias estén habilitadas (Cloud Functions, Firestore, Eventarc, Cloud Scheduler)
-  Revisar logs: `firebase functions:log`

**Errores de permisos en el primer deploy:**

-  Es normal, puede tardar 2-3 minutos en configurar permisos
-  Esperar y volver a intentar el deploy

**Contador no se actualiza:**

-  Verificar que los reportes tengan el campo `timestamp` (número)
-  Revisar logs para errores de actualización

**Estación no se reabre automáticamente:**

-  Verificar que la razón sea exactamente "Alta actividad de reportes"
-  Confirmar que pasaron 15 minutos sin reportes nuevos
-  Revisar logs de `reabrirEstacionesInactivas`
-  [ ] Notificaciones push cuando se cierra una estación
-  [ ] Dashboard de estadísticas en tiempo real
-  [ ] Función scheduled para limpiar reportes antiguos
