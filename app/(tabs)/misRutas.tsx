import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function MisRutas() {
  return (
    <View style={styles.container}>
      <Text>MisRutas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
});