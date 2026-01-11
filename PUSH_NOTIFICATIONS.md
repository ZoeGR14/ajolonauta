# Configuración de Push Notifications con Expo

## 📋 Pasos de Configuración

### 1. Obtener Project ID de Expo

```bash
npx expo login
eas init
```

Copia el `projectId` del archivo `app.config.js` y reemplázalo en:

-  `services/notifications.ts` línea 51

### 2. Configurar app.config.js

Agrega el plugin de notificaciones:

```javascript
plugins: [
  // ... otros plugins
  [
    "expo-notifications",
    {
      icon: "./assets/images/notification-icon.png",
      color: "#e68059",
      sounds: ["./assets/sounds/notification.wav"],
    },
  ],
],
```

### 3. Agregar permisos en app.config.js

```javascript
android: {
  permissions: [
    "RECEIVE_BOOT_COMPLETED",
    "VIBRATE",
    "NOTIFICATIONS",
  ],
},
ios: {
  infoPlist: {
    UIBackgroundModes: ["remote-notification"],
  },
},
```

### 4. Compilar y generar APK/IPA

Las notificaciones push **NO funcionan en Expo Go**. Debes crear un build:

```bash
# Para Android
eas build --platform android --profile preview

# Para iOS
eas build --platform ios --profile preview
```

### 5. Desplegar Firebase Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 🔔 Flujo de Notificaciones

1. **Usuario abre la app** → Se registra el token de notificación
2. **Token se guarda en Firestore** → `users/{userId}/pushToken`
3. **Estación se cierra** → Cloud Function detecta el cierre
4. **Busca rutas afectadas** → Revisa `rutas_guardadas` collection
5. **Identifica usuarios** → Obtiene tokens de usuarios afectados
6. **Envía notificaciones** → Usa Expo Push Notification API

## 📱 Tipos de Notificaciones

### Alta Demanda de Reportes

-  **Título**: "⚠️ Problemas en tu Ruta"
-  **Mensaje**: "La estación {nombre} tiene alta demanda de reportes..."

### Estación Cerrada

-  **Título**: "🚫 Estación Cerrada en tu Ruta"
-  **Mensaje**: "La estación {nombre} está cerrada..."

## 🧪 Probar Notificaciones

### En desarrollo (con build preview):

```bash
# 1. Instalar el APK/IPA generado
# 2. Abrir la app y permitir notificaciones
# 3. En Firebase Console, agregar una estación a estaciones_cerradas
# 4. La función detectará el cambio y enviará notificaciones
```

### Manualmente con curl:

```bash
curl -H "Content-Type: application/json" \
     -X POST \
     -d '{
       "to": "ExponentPushToken[xxxxxxxxxxxxxx]",
       "title": "Test",
       "body": "Mensaje de prueba"
     }' \
     https://exp.host/--/api/v2/push/send
```

## 🔧 Troubleshooting

### "Must use physical device"

-  Las notificaciones no funcionan en simulador/emulador
-  Usa un dispositivo físico con el build preview

### Token no se guarda

-  Verifica que el usuario esté autenticado
-  Revisa los logs en consola: `console.log("Push Token:", token)`

### No llegan notificaciones

-  Verifica que el usuario haya aceptado permisos
-  Revisa Firebase Functions logs: `firebase functions:log`
-  Asegúrate de que el token esté en Firestore

### Error "projectId" requerido

-  Obtén el projectId con `eas init`
-  Actualiza `services/notifications.ts`

## 📚 Referencias

-  [Expo Notifications](https://docs.expo.dev/push-notifications/overview/)
-  [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/)
-  [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
