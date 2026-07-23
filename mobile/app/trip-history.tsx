import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import {
  getCompletedTrips,
  deleteCompletedTrip,
  updateCompletedTripNotes,
  CompletedTrip,
} from "../src/services/completedTripService";

const formatElapsed = (ms: number) => {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes} min`;
  return `${hours} hr ${minutes} min`;
};

export default function TripHistoryScreen() {
  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState("");

  const handleRunAgain = (trip: CompletedTrip) => {
    router.replace(
      `/plan-trip?completedTripId=${trip.id}`
    );
  };

  const handleEditNotes = (trip: CompletedTrip) => {
    setEditingTripId(trip.id);
    setEditingNotes(trip.notes || "");
  };

  const handleSaveNotes = async (tripId: string) => {
    await updateCompletedTripNotes(tripId, editingNotes);
    setEditingTripId(null);
    setEditingNotes("");
    loadTrips();
  };

  const handleDeleteTrip = (trip: CompletedTrip) => {
    Alert.alert(
      "Remove Trip from History?",
      `Are you sure you want to remove this ${trip.riverName} trip from your history?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deleteCompletedTrip(trip.id);
            loadTrips();
          },
        },
      ]
    );
  };

  const loadTrips = async () => {
    setLoading(true);
    const trips = await getCompletedTrips();
    setCompletedTrips(trips);
    setLoading(false);
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const stats = useMemo(() => {
    const tripsCompleted = completedTrips.length;

    const milesPaddled = completedTrips.reduce(
      (sum, trip) => sum + trip.actualDistanceMiles,
      0
    );

    const plannedMiles = completedTrips.reduce(
      (sum, trip) => sum + trip.plannedDistanceMiles,
      0
    );

    const elapsedMs = completedTrips.reduce(
      (sum, trip) => sum + trip.elapsedMs,
      0
    );

    const riversExplored = new Set(
      completedTrips.map((trip) => trip.riverId)
    ).size;

    return {
      tripsCompleted,
      milesPaddled,
      plannedMiles,
      elapsedMs,
      riversExplored,
    };
  }, [completedTrips]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Loading trip history...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={40}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Trip History</Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Lifetime Stats</Text>

          <Text style={styles.stat}>
            Trips Completed: {stats.tripsCompleted}
          </Text>

          <Text style={styles.stat}>
            Actual Miles: {stats.milesPaddled.toFixed(2)}
          </Text>

          <Text style={styles.stat}>
            Planned Miles: {stats.plannedMiles.toFixed(2)}
          </Text>

          <Text style={styles.stat}>
            Time on Water: {formatElapsed(stats.elapsedMs)}
          </Text>

          <Text style={styles.stat}>
            Rivers Explored: {stats.riversExplored}
          </Text>
        </View>

        {completedTrips.length === 0 ? (
          <Text style={styles.empty}>No completed trips yet.</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {completedTrips.map((trip) => (
              <View key={trip.id} style={styles.card}>
                <Text style={styles.river}>
                  {trip.riverName}, {trip.state}
                </Text>

                <Text style={styles.date}>
                  {new Date(trip.completedAt).toLocaleDateString()}
                </Text>

                <Text style={styles.stat}>
                  Start: {trip.start.name}
                </Text>

                <Text style={styles.stat}>
                  End: {trip.end.name}
                </Text>

                <Text style={styles.stat}>
                  Actual: {trip.actualDistanceMiles.toFixed(2)} mi
                </Text>

                <Text style={styles.stat}>
                  Planned: {trip.plannedDistanceMiles.toFixed(2)} mi
                </Text>

                <Text style={styles.stat}>
                  Time: {formatElapsed(trip.elapsedMs)}
                </Text>

                {editingTripId === trip.id ? (
                  <>
                    <TextInput
                      value={editingNotes}
                      onChangeText={setEditingNotes}
                      multiline
                      placeholder="Edit trip notes..."
                      placeholderTextColor="#777"
                      style={styles.notesInput}
                    />

                    <TouchableOpacity
                      style={styles.saveNotesButton}
                      onPress={() => handleSaveNotes(trip.id)}
                    >
                      <Text style={styles.buttonText}>Save Notes</Text>
                    </TouchableOpacity>
                  </>
                ) : trip.notes ? (
                  <Text style={styles.notes}>Notes: {trip.notes}</Text>
                ) : (
                  <Text style={styles.noNotes}>No notes yet.</Text>
                )}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRunAgain(trip)}
                  >
                    <Text style={styles.actionButtonText}>Run Again</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditNotes(trip)}
                  >
                    <Text style={styles.actionButtonText}>Edit Notes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTrip(trip)}
                  >
                    <Text style={styles.deleteText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
    backgroundColor: "#F5F7FA",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  empty: {
    fontSize: 15,
    color: "#555",
  },
  list: {
    paddingBottom: 250,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  river: {
    fontSize: 18,
    fontWeight: "700",
  },
  date: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    marginBottom: 8,
  },
  stat: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  notes: {
    marginTop: 10,
    fontSize: 14,
    color: "#333",
    fontStyle: "italic",
  },
  notesInput: {
    marginTop: 10,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 10,
    textAlignVertical: "top",
    color: "#111",
  },
  noNotes: {
    marginTop: 10,
    fontSize: 14,
    color: "#777",
    fontStyle: "italic",
  },
  saveNotesButton: {
    marginTop: 8,
    backgroundColor: "#1CA7A6",
    padding: 10,
    borderRadius: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#1CA7A6",
    padding: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#D9534F",
    padding: 10,
    borderRadius: 10,
  },
  deleteText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
  },
  keyboardContainer: {
    flex: 1,
  },
});