import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Alert, BackHandler, Text, View } from "react-native";
import { WebView } from "react-native-webview";

export default function Avisos() {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "¿Salir de la app?",
          "¿Estás segura/o de que quieres salir?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Salir", onPress: () => BackHandler.exitApp() },
          ]
        );
        return true; // Previene el comportamiento por defecto
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", padding: 10 }}>
        Últimos Avisos
      </Text>
      <WebView
        source={{ uri: "https://x.com/MetroCDMX?ref_src=twsrc%5Etfw" }}
      />
    </View>
  );
}
