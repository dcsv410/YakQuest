import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

type Props = {
  safetyWarnings: string[];
  onContinue: () => void;
};

export default function SafetyScreen({
  safetyWarnings,
  onContinue,
}: Props) {
  return (
    <View style={styles.overview}>
      <ScrollView contentContainerStyle={styles.overviewContent}>
        <Text style={styles.title}>Ready To Launch?</Text>

        <Text style={styles.stat}>Wear a PFD</Text>
        <Text style={styles.stat}>Pack drinking water</Text>
        <Text style={styles.stat}>Leave no trash</Text>
        <Text style={styles.stat}>Respect wildlife</Text>
        <Text style={styles.stat}>Watch for strainers and sweepers</Text>
        <Text style={styles.stat}>Tell someone your route</Text>

        {safetyWarnings.map((w, i) => (
          <Text key={i} style={styles.stat}>
            ⚠️ {w}
          </Text>
        ))}

        <TouchableOpacity style={styles.button} onPress={onContinue}>
          <Text style={styles.buttonText}>Let's Go!</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overview: {
    position: "absolute",
    top: 40,
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
  },
  overviewContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  stat: {
    marginTop: 6,
    fontSize: 13,
    color: "#333",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#1CA7A6",
    padding: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
  },
});