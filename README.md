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
-  🚍 **Planificación de Rutas**: Consulta y guarda tus rutas favoritas de transporte público
-  🤖 **Detección Automática**: Cloud Functions detectan estaciones cerradas por alta actividad de reportes
-  🔄 **Reapertura Automática**: Estaciones cerradas se reabren automáticamente después de 15 minutos sin actividad
-  📢 **Sistema de Avisos**: Crea y consulta avisos en tiempo real sobre el estado del transporte
-  🆘 **Botón SOS**: Funcionalidad de emergencia para situaciones críticas
-  👤 **Gestión de Perfil**: Sistema completo de autenticación y personalización de usuario
-  📱 **Interfaz Intuitiva**: Diseño moderno y fácil de usar con navegación por pestañas
-  💾 **Almacenamiento Local**: Guarda tus preferencias y rutas favoritas localmente
-  🔐 **Autenticación Segura**: Sistema de login/registro con Firebase Authentication
-  🔒 **Variables de Entorno**: Credenciales protegidas con EAS Secrets

---

## 🛠️ Tecnologías utilizadas

### Frontend

-  **React Native** (0.79.4) - Framework principal para desarrollo móvil
-  **Expo** (SDK 53) - Plataforma de desarrollo
-  **TypeScript** - Para tipado estático y mejor experiencia de desarrollo
-  **Expo Router** - Sistema de navegación basado en archivos

### Backend & Servicios

-  **Firebase** (11.9.0)
   -  Authentication - Gestión de usuarios
   -  Firestore - Base de datos en tiempo real
   -  Cloud Functions (Gen 2) - Detección automática de estaciones cerradas
   -  Storage - Almacenamiento de archivos

### Bibliotecas Principales

-  **React Native Maps** - Visualización de mapas
-  **React Native Paper** - Componentes UI Material Design
-  **React Native Reanimated** - Animaciones fluidas
-  **AsyncStorage** - Persistencia local de datos
-  **Expo Image Picker** - Selección de imágenes de perfil

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
4. Copia las credenciales a tu archivo `.env`

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

### 5. EAS Secrets (para builds en la nube)

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

O consulta `SECURITY.md` para la guía completa de configuración segura.

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
│   ├── _layout.tsx              # Layout principal
│   ├── (auth)/                  # Módulo de autenticación
│   │   ├── index.tsx           # Pantalla de bienvenida
│   │   ├── login.tsx           # Inicio de sesión
│   │   ├── signup.tsx          # Registro
│   │   └── forgot-pass.tsx     # Recuperación de contraseña
│   └── (tabs)/                  # Navegación principal con pestañas
│       ├── mapa.tsx            # Visualización de mapas
│       ├── misRutas.tsx        # Rutas del usuario (con lógica de estaciones cerradas)
│       ├── sos.tsx             # Botón de emergencia
│       ├── (index)/            # Home y avisos
│       │   ├── index.tsx       # Pantalla principal
│       │   └── (comentarios)/  # Sistema de avisos
│       │       ├── crearAviso.tsx
│       │       └── leerAvisos.tsx
│       └── (perfil)/           # Módulo de perfil
│           ├── perfil.tsx
│           ├── configuracion.tsx
│           └── (guardadas)/    # Rutas guardadas
│               └── rutasGuardadas.tsx
├── assets/                      # Recursos estáticos
│   ├── data/                   # Datos locales (metro, terminales)
│   ├── fonts/                  # Fuentes personalizadas
│   └── images/                 # Imágenes y iconos
├── functions/                   # Cloud Functions para Firebase
│   └── src/
│       └── index.ts            # Funciones de detección y reapertura automática
├── FirebaseConfig.ts           # Configuración de Firebase con variables de entorno
├── app.config.js               # Configuración dinámica de Expo
├── .env                        # Variables de entorno (NO SUBIR A GIT)
├── .env.example                # Plantilla de variables de entorno
├── firestore.rules             # Reglas de seguridad de Firestore
├── SECURITY.md                 # Guía de configuración de seguridad
├── app.json                    # Configuración de Expo
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
-  Guardar rutas favoritas
-  Información detallada de cada ruta
-  Historial de búsquedas

### 4. **Sistema de Avisos**

-  Crear avisos sobre el estado del transporte
-  Leer avisos de otros usuarios
-  **Detección automática**: Cloud Functions cierran estaciones con 5+ reportes en 15 minutos
-  **Reapertura automática**: Estaciones inactivas por 15+ minutos se reabren automáticamente
-  **Contador dinámico**: Actualización en tiempo real de cantidad de reportes
-  Notificaciones en tiempo real

### 5. **Perfil de Usuario**

-  Edición de información personal
-  Gestión de foto de perfil
-  Configuración de preferencias
-  Visualización de rutas guardadas

### 6. **Botón SOS**

-  Función de emergencia rápida
-  Contacto con autoridades o contactos de emergencia
-  Compartir ubicación actual

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
```

---

## 📱 Compilación

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

## 📄 Licencia

Este proyecto es privado y fue desarrollado como parte de un proyecto universitario.

---

## 🙏 Agradecimientos

-  A la comunidad de Expo y React Native
-  A Firebase por sus servicios de backend
-  A Google Maps por la API de mapas
-  A todos los colaboradores del proyecto

---

**¡Gracias por usar AjoloNauta! 🚌✨**
