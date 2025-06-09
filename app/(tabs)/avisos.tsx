import { Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Avisos() {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', padding: 10 }}>Últimos Avisos</Text>
      <WebView source={{ uri: 'https://x.com/MetroCDMX' }} />
    </View>
  );
}
