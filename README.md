# 🚌 AjoloNauta

**AjoloNauta** es una aplicación móvil diseñada para facilitar la navegación en el transporte público, permitiendo a los usuarios planificar rutas, consultar información en tiempo real, y compartir avisos sobre el estado del servicio. Ideal para viajeros frecuentes del transporte público que buscan optimizar sus desplazamientos diarios.

---

## 📋 Tabla de Contenidos

-  [Características](#-características)
-  [Tecnologías utilizadas](#%EF%B8%8F-tecnologías-utilizadas)
-  [Requisitos Previos](#-requisitos-previos)
-  [Instalación](#-instalación)
-  [Configuración](#%EF%B8%8F-configuración)
-  [Ejecución del Proyecto](#-ejecución-del-proyecto)
-  [Estructura del Proyecto](#-estructura-del-proyecto)
-  [Funcionalidades Principales](#-funcionalidades-principales)
-  [Scripts Disponibles](#-scripts-disponibles)
-  [Compilación](#-compilación)
-  [Licencia](#-licencia)
-  [Agradecimientos](#-agradecimientos)

---

## ✨ Características

-  🗺️ **Visualización de Mapas**: Integración con Google Maps para visualizar rutas de transporte público
-  🚍 **Planificación de Rutas**: Consulta y guarda tus rutas favoritas de transporte público con algoritmo de Dijkstra
-  🤖 **Detección Automática**: Cloud Functions detectan estaciones cerradas por alta actividad de reportes (5+ en 15 minutos)
-  🔄 **Reapertura Automática**: Estaciones cerradas se reabren automáticamente después de 15 minutos sin actividad
-  🔔 **Notificaciones Push**: Sistema de notificaciones que alerta a usuarios cuando una estación en sus rutas guardadas se cierra
-  📊 **Contador en Tiempo Real**: Visualización dinámica de la cantidad de reportes activos por estación
-  📢 **Sistema de Avisos**: Crea y consulta avisos en tiempo real sobre el estado del transporte
-  🗂️ **Gestión de Rutas Guardadas**: Guarda, visualiza y elimina tus rutas frecuentes con persistencia en Firestore
-  🆘 **Botón SOS**: Funcionalidad de emergencia para situaciones críticas con acceso a contactos
-  👤 **Gestión de Perfil**: Sistema completo de autenticación y personalización de usuario con foto de perfil
-  📱 **Interfaz Intuitiva**: Diseño moderno con navegación por pestañas y componentes Material Design
-  💾 **Persistencia de Datos**: AsyncStorage para datos locales y Firestore para sincronización en la nube
-  🔐 **Autenticación Segura**: Sistema de login/registro con Firebase Authentication y persistencia de sesión
-  🔒 **Variables de Entorno**: Credenciales protegidas con archivo env y EAS Secrets para builds de producción
-  ⏱️ **Scheduler Automático**: Cloud Functions programadas que verifican y reabren estaciones cada 15 minutos

---

## 🛠️ Tecnologías utilizadas

### Frontend

-  **React Native** (0.79.4) - Framework principal para desarrollo móvil
-  **Expo** (SDK 53) - Plataforma de desarrollo
-  **TypeScript** - Para tipado estático y mejor experiencia de desarrollo
-  **Expo Router** - Sistema de navegación basado en archivos

### Backend & Servicios

-  **Firebase** (11.10.0)
   -  Authentication - Gestión de usuarios y persistencia de sesión
   -  Firestore - Base de datos en tiempo real con listeners y queries
   -  Cloud Functions (Gen 2) - Detección automática de estaciones cerradas y reapertura programada
   -  Cloud Messaging - Sistema de notificaciones push a usuarios afectados
   -  Storage - Almacenamiento de archivos y fotos de perfil
-  **Firebase Admin SDK** (13.6.0) - Para operaciones del lado del servidor
-  **Cloud Scheduler** - Funciones programadas que ejecutan cada 15 minutos

### Bibliotecas Principales

-  **React Native Maps** - Visualización de mapas con marcadores y polylines
-  **React Native Paper** - Componentes UI Material Design
-  **React Native Reanimated** (3.18.2) - Animaciones fluidas de alto rendimiento
-  **AsyncStorage** (2.1.2) - Persistencia local de datos
-  **Expo Image Picker** (16.1.4) - Selección de imágenes de perfil
-  **Expo Notifications** (0.31.4) - Sistema completo de notificaciones push
-  **Expo Device** - Detección de dispositivos físicos para notificaciones
-  **Expo Contacts** - Acceso a contactos de emergencia para el botón SOS
-  **React Native Autocomplete Input** - Búsqueda predictiva de estaciones

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

-  **Node.js** (versión 18 o superior)
-  **npm** o **yarn**
-  **Expo CLI**: `npm install -g expo-cli`
-  **Git** (opcional, para clonar el repositorio)

### Para desarrollo móvil:

-  **Android Studio** (para emulador Android)
-  **Xcode** (para emulador iOS - solo macOS)
-  **Expo Go** app (para pruebas en dispositivo físico)

---

## 🚀 Instalación

1. **Clona el repositorio** (o descarga el código fuente):

```bash
git clone https://github.com/ZoeGR14/ajolonauta.git
cd ajolonauta
```

2. **Instala las dependencias**:

```bash
npm install
```

O si prefieres yarn:

```bash
yarn install
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

El proyecto usa variables de entorno para credenciales sensibles. Crea un archivo `.env` en la raíz del proyecto:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=tu-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=tu-app-id

# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu-google-maps-api-key
```

**Importante**: El archivo `.env` está en `.gitignore` y NO debe subirse a Git. Comparte estas credenciales con tu equipo por canales seguros (gestores de contraseñas, mensajería encriptada).

### 2. Firebase Configuration

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** (Email/Password) y **Firestore Database**
3. Habilita **Cloud Functions** para las funciones de detección automática
4. Habilita **Cloud Messaging** para notificaciones push
5. Descarga el archivo `google-services.json` para Android y colócalo en la raíz del proyecto
6. Configura el **Firebase Admin SDK** para las Cloud Functions
7. Copia las credenciales a tu archivo `env`

### 3. Google Maps API

1. Obtén una API Key en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita **Maps SDK for Android** (y iOS si usas iPhone)
3. **Configura restricciones** para proteger tu clave:
   -  Application restrictions → Android apps
   -  Agrega tu package name y SHA-1
4. Copia la clave a tu archivo `.env`

### 4. Firestore Security Rules

Despliega las reglas de seguridad para proteger tu base de datos:

```bash
firebase deploy --only firestore:rules
```

### 5. Cloud Functions

Despliega las Cloud Functions para detección automática y notificaciones:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

Las funciones desplegadas incluyen:

-  `detectarEstacionCerrada`: Detecta cuando una estación debe cerrarse (5+ reportes en 15 min)
-  `reabrirEstacionesInactivas`: Se ejecuta cada 15 minutos para reabrir estaciones sin actividad
-  `notificarUsuariosAfectados`: Envía notificaciones push a usuarios con rutas guardadas afectadas

### 6. EAS Secrets (para builds en la nube)

Configura las variables de entorno en EAS para compilar la app:

```bash
eas env:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "tu-valor" --environment production
eas env:create --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "tu-valor" --environment production
eas env:create --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "tu-valor" --environment production
eas env:create --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "tu-valor" --environment production
eas env:create --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "tu-valor" --environment production
eas env:create --name EXPO_PUBLIC_FIREBASE_APP_ID --value "tu-valor" --environment production
eas env:create --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "tu-valor" --environment production
```

O consulta la documentación del proyecto para la guía completa de configuración segura.

### 7. Configuración de Notificaciones Push

Para habilitar las notificaciones push:

1. **Obtén el Project ID de Expo**:

   -  Ejecuta `npx expo login` y luego `eas project:init`
   -  El Project ID aparecerá en tu `app.config.js` o en la consola Expo

2. **Configura el proyecto en Expo**:

   ```javascript
   // El projectId ya está configurado en services/notifications.ts
   projectId: "327e210d-776c-4591-89e8-538b2839329b";
   ```

3. **Permisos en Android**:

   -  Los permisos ya están configurados en `app.config.js`:

   ```javascript
   permissions: ["RECEIVE_BOOT_COMPLETED", "VIBRATE", "NOTIFICATIONS"];
   ```

4. **Prueba las notificaciones**:
   -  Las notificaciones se envían automáticamente cuando una estación se cierra y afecta rutas guardadas
   -  El sistema guarda el token de notificación del usuario en Firestore automáticamente al hacer login

## 🎯 Ejecución del Proyecto

### Modo Desarrollo

1. **Inicia el servidor de desarrollo**:

```bash
npm start
```

O también:

```bash
npx expo start
```

2. **Ejecuta en diferentes plataformas**:

-  **Android**:

```bash
npm run android
```

-  **iOS** (solo macOS):

```bash
npm run ios
```

-  **Web**:

```bash
npm run web
```

### Usando Expo Go

1. Descarga **Expo Go** desde:

   -  [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android)
   -  [App Store](https://apps.apple.com/app/expo-go/id982107779) (iOS)

2. Escanea el código QR que aparece en la terminal con la app Expo Go

3. La aplicación se cargará automáticamente en tu dispositivo

---

## 📁 Estructura del Proyecto

```
app_movil/
├── app/                          # Código fuente de la aplicación
│   ├── _layout.tsx              # Layout principal con SafeAreaProvider
│   ├── (auth)/                  # Módulo de autenticación
│   │   ├── index.tsx           # Pantalla de bienvenida
│   │   ├── login.tsx           # Inicio de sesión
│   │   ├── signup.tsx          # Registro
│   │   └── forgot-pass.tsx     # Recuperación de contraseña
│   └── (tabs)/                  # Navegación principal con pestañas
│       ├── mapa.tsx            # Visualización de mapas con marcadores
│       ├── misRutas.tsx        # Rutas con algoritmo Dijkstra y detección de estaciones cerradas
│       ├── sos.tsx             # Botón de emergencia con contactos
│       ├── (index)/            # Home y avisos
│       │   ├── index.tsx       # Pantalla principal con feed de avisos
│       │   └── (comentarios)/  # Sistema de avisos/reportes
│       │       └── crearAviso.tsx  # Crear reportes por estación
│       └── (perfil)/           # Módulo de perfil
│           ├── perfil.tsx      # Perfil con foto y datos del usuario
│           ├── configuracion.tsx
│           └── (guardadas)/    # Rutas guardadas
│               ├── rutasGuardadas.tsx  # Lista de rutas guardadas del usuario
│               └── [id].tsx    # Detalle individual de ruta guardada
├── assets/                      # Recursos estáticos
│   ├── data/                   # Datos locales (metro, terminales, grafo para Dijkstra)
│   │   ├── info.ts            # Grafo del metro y funciones de cálculo de rutas
│   │   ├── metro.json         # Datos estructurados del metro
│   │   └── terminales.json    # Información de terminales de transporte
│   ├── fonts/                  # Fuentes personalizadas (Poppins)
│   └── images/                 # Imágenes, iconos y mapas de líneas
│       └── Lineas_Metro/      # Imágenes de las líneas del metro
├── functions/                   # Cloud Functions para Firebase
│   ├── src/
│   │   ├── index.ts           # Funciones de detección y reapertura automática
│   │   └── notificaciones.ts  # Sistema de notificaciones push
│   ├── lib/                    # Código compilado de TypeScript
│   ├── package.json           # Dependencias de Cloud Functions
│   └── tsconfig.json          # Configuración de TypeScript para functions
├── services/                    # Servicios de la aplicación
│   └── notifications.ts        # Servicio de notificaciones push del cliente
├── FirebaseConfig.ts           # Configuración de Firebase con variables de entorno
├── app.config.js               # Configuración dinámica de Expo con env
├── env                         # Variables de entorno (NO SUBIR A GIT)
├── .env.example                # Plantilla de variables de entorno
├── google-services.json        # Configuración de Firebase para Android
├── firestore.rules             # Reglas de seguridad de Firestore
├── firebase.json               # Configuración de Firebase CLI
├── eas.json                    # Configuración de Expo Application Services
├── package.json                # Dependencias del proyecto
└── tsconfig.json               # Configuración de TypeScript
```

---

## 🎨 Funcionalidades Principales

### 1. **Autenticación de Usuarios**

-  Registro con email y contraseña
-  Inicio de sesión seguro
-  Recuperación de contraseña
-  Persistencia de sesión

### 2. **Mapa Interactivo**

-  Visualización de rutas de transporte
-  Ubicación en tiempo real
-  Marcadores de terminales y paradas
-  Integración con Google Maps

### 3. **Gestión de Rutas**

-  Consulta de rutas disponibles
-  **Algoritmo de Dijkstra** para calcular la ruta más corta entre estaciones
-  Guardar rutas favoritas en Firestore con persistencia en la nube
-  Información detallada de cada ruta con polylines coloreadas por línea
-  **Detección de estaciones cerradas**: Las rutas muestran alertas cuando una estación está cerrada
-  **Filtrado dinámico**: El algoritmo excluye automáticamente estaciones cerradas del cálculo
-  Visualización en mapa con marcadores personalizados por línea
-  Eliminar rutas guardadas con confirmación
-  Ver detalle completo de rutas guardadas individuales

### 4. **Sistema de Avisos y Reportes**

-  Crear reportes/avisos sobre el estado de estaciones específicas
-  Leer avisos de otros usuarios en tiempo real
-  **Sistema de detección automática**:
   -  Cloud Functions monitorean reportes en tiempo real
   -  Estaciones con 5+ reportes en 15 minutos se marcan automáticamente como cerradas
   -  Actualización del campo `estadoCerrada` en Firestore
-  **Sistema de reapertura automática**:
   -  Cloud Scheduler ejecuta cada 15 minutos
   -  Estaciones cerradas sin reportes nuevos por 15+ minutos se reabren automáticamente
   -  Limpieza automática de reportes antiguos
-  **Contador dinámico**: Visualización en tiempo real de cantidad de reportes activos
-  **Notificaciones push inteligentes**:
   -  Sistema detecta usuarios con rutas guardadas afectadas
   -  Envía notificaciones push automáticas cuando sus estaciones se cierran
   -  Mensajes personalizados según la causa del cierre
-  Listeners en tiempo real con Firestore para actualizaciones instantáneas

### 5. **Perfil de Usuario**

-  Edición de información personal (nombre, email)
-  Gestión de foto de perfil con Expo Image Picker
-  Almacenamiento de imágenes en Firebase Storage
-  Configuración de preferencias
-  Visualización de rutas guardadas con acceso directo
-  Sistema de autenticación con persistencia de sesión
-  Token de notificaciones push guardado automáticamente en Firestore

### 6. **Botón SOS**

-  Función de emergencia rápida con interfaz dedicada
-  Acceso a contactos de emergencia del dispositivo con Expo Contacts
-  Contacto con autoridades o contactos de emergencia
-  Interfaz simple y accesible para situaciones críticas

---

## 📜 Scripts Disponibles

```bash
# Inicia el servidor de desarrollo
npm start

# Ejecuta en Android
npm run android

# Ejecuta en iOS
npm run ios

# Ejecuta en web
npm run web

# Ejecuta el linter
npm run lint

# Resetea el proyecto (limpia archivos de ejemplo)
npm run reset-project

# Cloud Functions
cd functions
npm run build        # Compila TypeScript a JavaScript
npm run deploy       # Despliega las functions a Firebase
```

---

## 🔧 Tecnologías y Arquitectura Avanzada

### Algoritmo de Dijkstra

El proyecto implementa el **algoritmo de Dijkstra** para calcular la ruta más corta entre dos estaciones del metro:

-  Implementación optimizada en [assets/data/info.ts](assets/data/info.ts)
-  Grafo ponderado con distancias reales entre estaciones
-  Filtrado dinámico de estaciones cerradas
-  Construcción automática de polylines para visualización en mapa

### Cloud Functions Gen 2

Sistema robusto de funciones serverless:

1. **detectarEstacionCerrada**:

   -  Trigger: `onDocumentUpdated` en colección `estaciones`
   -  Verifica reportes en ventana de 15 minutos
   -  Marca estación como cerrada si hay 5+ reportes
   -  Envía notificaciones push a usuarios afectados

2. **reabrirEstacionesInactivas**:

   -  Trigger: `onSchedule` cada 15 minutos
   -  Busca estaciones cerradas sin actividad reciente
   -  Reabre automáticamente y limpia reportes antiguos
   -  Actualiza colección `estaciones_cerradas`

3. **notificarUsuariosAfectados**:
   -  Busca rutas guardadas que contengan la estación cerrada
   -  Obtiene tokens de notificación de Firestore
   -  Envía notificaciones push mediante Firebase Cloud Messaging
   -  Mensajes personalizados según el tipo de cierre

### Sistema de Notificaciones Push

-  Registro automático de dispositivos con Expo Notifications
-  Tokens almacenados en Firestore bajo `/users/{userId}/pushToken`
-  Canal de notificaciones configurado para Android
-  Soporte para iOS con permisos gestionados
-  Notificaciones en foreground y background

---

## �️ Estructura de Datos en Firestore

### Colección: `estaciones`

```typescript
{
  estacionId: string,              // "NombreEstacion - Línea X"
  estacion: string,                // "NombreEstacion"
  linea: string,                   // "Línea X"
  estadoCerrada: boolean,          // true si está cerrada
  fechaCierre?: number,            // timestamp del cierre
  ultimaActualizacion: Timestamp,
  totalReportes: number[],         // timestamps de reportes activos
  comentarios: Reporte[],          // array de reportes
  fechaCreacion: Timestamp
}
```

### Colección: `estaciones_cerradas`

```typescript
{
  estacionId: string,
  estacion: string,
  linea: string,
  fechaCierre: number,
  razon: string,                   // "Alta actividad de reportes"
  reportesActivos: number,         // contador de reportes
  ultimaActualizacion: Timestamp
}
```

### Colección: `rutas_guardadas`

```typescript
{
  userId: string,
  start: string,                   // estación de origen
  end: string,                     // estación de destino
  path: string[],                  // array de estaciones en la ruta
  createdAt: Timestamp
}
```

### Colección: `users`

```typescript
{
  email: string,
  nombre: string,
  photoURL?: string,
  pushToken?: string,              // token de Expo para notificaciones
  lastTokenUpdate: Timestamp
}
```

---

## �📱 Compilación

### Build de Desarrollo

Para crear una build de desarrollo con Expo:

```bash
npx expo install expo-dev-client
npx expo run:android
# o
npx expo run:ios
```

### Build de Producción con EAS

1. **Instala EAS CLI**:

```bash
npm install -g eas-cli
```

2. **Configura EAS**:

```bash
eas login
eas build:configure
```

3. **Crea la build**:

```bash
# Para Android
eas build --platform android

# Para iOS
eas build --platform ios

# Para ambas plataformas
eas build --platform all
```

---

## � Notas Importantes

### Arquitectura del Proyecto

-  **File-based routing**: Expo Router gestiona la navegación basándose en la estructura de carpetas
-  **Layouts anidados**: `_layout.tsx` en cada carpeta define layouts específicos
-  **Guards de autenticación**: Redirección automática según estado de autenticación
-  **Real-time listeners**: Uso de `onSnapshot` de Firestore para actualizaciones en tiempo real

### Variables de Entorno

El proyecto usa un archivo `env` (sin punto) en lugar de `.env`:

-  Las variables se cargan en `app.config.js` usando `fs.readFileSync`
-  Se exponen a la app mediante `expo-constants` con el prefijo `EXPO_PUBLIC_`
-  Para builds de producción, configurar en EAS Secrets

### Cloud Functions

-  Implementadas con Firebase Functions Gen 2
-  Requieren Node.js 18+
-  Se despliegan independientemente con `firebase deploy --only functions`
-  Logs disponibles en Firebase Console

### Notificaciones Push

-  Requieren dispositivo físico (no funcionan en emulador)
-  Project ID: `327e210d-776c-4591-89e8-538b2839329b`
-  Los tokens se actualizan automáticamente en cada login
-  Canal configurado para Android con vibración y sonido

---

## �📄 Licencia

Este proyecto es privado y fue desarrollado como parte de un proyecto universitario.

---

## 🙏 Agradecimientos

-  A la comunidad de **Expo** y **React Native** por el excelente framework
-  A **Firebase** por sus servicios de backend robustos y escalables
-  A **Google Maps** por la API de mapas y geolocalización
-  A todos los colaboradores del proyecto **AjoloNauta**

---

## 👥 Desarrolladores

Este proyecto fue desarrollado como parte de un proyecto universitario de desarrollo de aplicaciones móviles.

---

**¡Gracias por usar AjoloNauta! 🚌✨**

_Versión 1.0.0 - Enero 2026_
