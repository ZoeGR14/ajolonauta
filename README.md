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
-  📢 **Sistema de Avisos**: Crea y consulta avisos en tiempo real sobre el estado del transporte
-  🆘 **Botón SOS**: Funcionalidad de emergencia para situaciones críticas
-  👤 **Gestión de Perfil**: Sistema completo de autenticación y personalización de usuario
-  📱 **Interfaz Intuitiva**: Diseño moderno y fácil de usar con navegación por pestañas
-  💾 **Almacenamiento Local**: Guarda tus preferencias y rutas favoritas localmente
-  🔐 **Autenticación Segura**: Sistema de login/registro con Firebase Authentication

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

### 1. Firebase Configuration

El proyecto ya incluye la configuración de Firebase en `FirebaseConfig.ts`. Si necesitas usar tu propia instancia de Firebase:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** y **Firestore**
3. Obtén las credenciales de tu proyecto
4. Actualiza el archivo `FirebaseConfig.ts`:

```typescript
const firebaseConfig = {
   apiKey: "TU_API_KEY",
   authDomain: "TU_AUTH_DOMAIN",
   projectId: "TU_PROJECT_ID",
   storageBucket: "TU_STORAGE_BUCKET",
   messagingSenderId: "TU_MESSAGING_SENDER_ID",
   appId: "TU_APP_ID",
};
```

### 2. Google Maps API (Android)

Para usar mapas en Android, necesitas configurar tu API Key:

1. Obtén una API Key de Google Maps en [Google Cloud Console](https://console.cloud.google.com/)
2. Actualiza `app.json`:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "TU_GOOGLE_MAPS_API_KEY"
    }
  }
}
```

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
│       ├── misRutas.tsx        # Rutas del usuario
│       ├── sos.tsx             # Botón de emergencia
│       ├── (index)/            # Home y avisos
│       │   ├── index.tsx       # Pantalla principal
│       │   └── (comentarios)/  # Sistema de avisos
│       │       ├── avisoTwitter.tsx
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
├── FirebaseConfig.ts           # Configuración de Firebase
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
-  Compartir en redes sociales (Twitter)
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
