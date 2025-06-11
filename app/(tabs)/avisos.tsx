import { useEffect } from 'react';
import { Alert, BackHandler, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Avisos() {
  useEffect(() => {
    const handleBackPress = () => {
      Alert.alert(
        "Salir de la app",
        "¿Deseas salir de la aplicación?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", onPress: () => BackHandler.exitApp() }
        ]
      );
      return true; // Evita que la navegación continúe
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress);

    return () => backHandler.remove(); // Limpieza del evento al desmontar
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', padding: 10 }}>Últimos Avisos</Text>
      <WebView source={{ uri: 'https://x.com/MetroCDMX?ref_src=twsrc%5Etfw' }} />
    </View>
  );
}
