import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  endedEarly?: boolean;
  onSave: (notes: string) => Promise<void>;
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
  endedEarly = false,
  onSave,
  onNavigateBackToStart,
  onDone,
}: Props) {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    if (isSaving || isSaved) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave(notes);
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save trip log", error);

      Alert.alert(
        "Unable to Save Trip",
        "Your trip log could not be saved. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {endedEarly
            ? "Trip Ended Early"
            : "Trip Complete"}
        </Text>
        <Text style={styles.subtitle}>{riverName}</Text>
        {endedEarly && (
          <View style={styles.earlyExitNotice}>
            <Text style={styles.earlyExitNoticeText}>
              This trip ended before the planned
              takeout. The recorded distance and
              time below reflect the portion of
              the trip that was completed.
            </Text>
          </View>
        )}

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
          editable={!isSaving && !isSaved}
          style={[
            styles.notes,
            isSaved && styles.notesDisabled,
          ]}
        />

        <TouchableOpacity
          style={[
            styles.button,
            (isSaving || isSaved) &&
              styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving || isSaved}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isSaved
                ? "Trip Log Saved"
                : "Save Trip Log"}
            </Text>
          )}
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
  buttonDisabled: {
    opacity: 0.6,
  },
  notesDisabled: {
    backgroundColor: "#F2F2F2",
    color: "#666",
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
  earlyExitNotice: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFF1E8",
    borderWidth: 1,
    borderColor: "#E8B58F",
  },
  earlyExitNoticeText: {
    color: "#7A3C16",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});