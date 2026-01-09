# Cloud Functions - Detección de Estaciones Cerradas

## 📋 Descripción

Esta función de Cloud Functions detecta automáticamente cuando una estación debe marcarse como cerrada basándose en la actividad de reportes.

## ⚙️ Funcionalidad

### `detectarEstacionCerrada`

**Trigger**: Se ejecuta automáticamente cuando se actualiza un documento en la colección `estaciones`

**Lógica**:

1. **Ventana de tiempo**: Últimos 15 minutos
2. **Umbral**: 5 o más reportes
3. **Acción**:
   -  Marca la estación como cerrada (`estadoCerrada: true`)
   -  Registra el timestamp del cierre
   -  Crea un documento en `estaciones_cerradas` con detalles

### Flujo de Ejecución

```
Nuevo reporte → Actualización en estaciones → Trigger de función
    ↓
Analizar reportes de últimos 15 minutos
    ↓
¿5+ reportes?
    ├─ SÍ → Marcar como cerrada + Crear registro
    └─ NO → No hacer nada
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

### Desplegar la Función

```bash
# Desde la raíz del proyecto
cd functions
npm install
npm run deploy
```

O específicamente esta función:

```bash
firebase deploy --only functions:detectarEstacionCerrada
```

## 📊 Logs y Monitoreo

Ver logs en tiempo real:

```bash
firebase functions:log
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

### Input (Documento en `estaciones`)

```typescript
{
  comentarios: [
    {
      timestamp: 1704722445000,
      usuario: "Juan Pérez",
      texto: "Reportando problema...",
      // ... otros campos
    }
  ],
  estadoCerrada: false,
  // ... otros campos
}
```

### Output (Documento en `estaciones_cerradas`)

```typescript
{
  estacionId: "Zócalo - Línea 2",
  estacion: "Zócalo",
  linea: "Línea 2",
  estado: "cerrada",
  razon: "Alta actividad de reportes",
  cantidadReportes: 5,
  reportesRecientes: [...], // Últimos 10 reportes
  fechaCierre: 1704722445000,
  fechaCierreFormato: "08/01/2026, 10:30:45 AM",
  timestampServidor: Timestamp
}
```

## ⚠️ Consideraciones

-  **Costo**: La función se ejecuta en cada actualización de estación
-  **Límite**: `maxInstances: 10` para control de costos
-  **Zona horaria**: `America/Mexico_City` para fechas formateadas
-  **Idempotencia**: No vuelve a cerrar una estación ya cerrada

## 🔧 Configuración

### Modificar Parámetros

En [index.ts](src/index.ts):

```typescript
// Cambiar ventana de tiempo (15 minutos por defecto)
const ventanaTiempo = 15 * 60 * 1000; // milisegundos

// Cambiar umbral de reportes (5 por defecto)
const UMBRAL_REPORTES = 5;
```

## 📌 Próximos Pasos

Posibles mejoras:

-  [ ] Función para reabrir estaciones automáticamente
-  [ ] Notificaciones push cuando se cierra una estación
-  [ ] Dashboard de estadísticas en tiempo real
-  [ ] Función scheduled para limpiar reportes antiguos
