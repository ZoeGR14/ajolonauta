import { View } from "react-native";
import { WebView } from "react-native-webview";

export default function TwitterProfile() {
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
