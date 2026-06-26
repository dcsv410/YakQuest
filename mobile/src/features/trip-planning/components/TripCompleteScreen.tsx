import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

type Props = {
  riverName: string;
  plannedDistanceMiles: number;
  actualDistanceMiles: number;
  elapsedMs: number;
  onSave: (notes: string) => void;
  onNavigateBackToStart: () => void;
  onDone: () => void;
};

const formatElapsed = (ms: number) => {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes} min`;
  return `${hours} hr ${minutes} min`;
};

export default function TripCompleteScreen({
  riverName,
  plannedDistanceMiles,
  actualDistanceMiles,
  elapsedMs,
  onSave,
  onNavigateBackToStart,
  onDone,
}: Props) {
  const [notes, setNotes] = useState("");

  return (
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Trip Complete</Text>
        <Text style={styles.subtitle}>{riverName}</Text>

        <Text style={styles.stat}>
          Actual Distance: {actualDistanceMiles.toFixed(2)} mi
        </Text>

        <Text style={styles.stat}>
          Planned Distance: {plannedDistanceMiles.toFixed(2)} mi
        </Text>

        <Text style={styles.stat}>
          Time: {formatElapsed(elapsedMs)}
        </Text>

        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes about this trip..."
          placeholderTextColor="#777"
          multiline
          style={styles.notes}
        />

        <TouchableOpacity style={styles.button} onPress={() => onSave(notes)}>
          <Text style={styles.buttonText}>Save Trip Log</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onNavigateBackToStart}>
          <Text style={styles.buttonText}>Navigate Back To Start</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onDone}>
          <Text style={styles.secondaryButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 40,
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
  },
  content: {
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: "#555",
  },
  stat: {
    marginTop: 10,
    fontSize: 15,
    color: "#333",
  },
  notes: {
    marginTop: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
    color: "#111",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#1CA7A6",
    padding: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1CA7A6",
  },
  secondaryButtonText: {
    color: "#1CA7A6",
    textAlign: "center",
    fontWeight: "700",
  },
});