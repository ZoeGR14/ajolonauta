import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Alert, BackHandler, View } from "react-native";
import { WebView } from "react-native-webview";

export default function TwitterProfile() {
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
        return true;
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
      <WebView
        source={{ uri: "https://x.com/MetroCDMX" }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
}
