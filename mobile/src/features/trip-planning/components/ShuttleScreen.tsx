import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { RiverPoint } from "../../../data/types";

type Props = {
  start: RiverPoint | null;
  end: RiverPoint | null;
  onNavigateToStart: (point: RiverPoint | null) => void;
  onNavigateToEnd: (point: RiverPoint | null) => void;
  onAlreadyAtLaunch: () => void;
};

export default function ShuttleScreen({
  start,
  end,
  onNavigateToStart,
  onNavigateToEnd,
  onAlreadyAtLaunch,
}: Props) {
  return (
    <View style={styles.overview}>
      <Text style={styles.title}>Where would you like to go first?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => onNavigateToStart(start)}
      >
        <Text style={styles.buttonText}>Navigate To Start</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => onNavigateToEnd(end)}
      >
        <Text style={styles.buttonText}>Navigate To End (Drop Vehicle)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onAlreadyAtLaunch}>
        <Text style={styles.buttonText}>Already At Launch</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: "700",
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