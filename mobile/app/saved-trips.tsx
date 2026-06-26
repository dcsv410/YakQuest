import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

import { useRouter, useFocusEffect } from "expo-router";

import {
  getSavedTrips,
  deleteSavedTrip,
  SavedTrip,
  syncSavedTripsAfterLogin,
} from "../src/services/savedTripService";

export default function SavedTripsScreen() {
  const router = useRouter();
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrips = async () => {
    setLoading(true);
    const trips = await getSavedTrips();
    setSavedTrips(trips);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      const loadAndSyncTrips = async () => {
        try {
          await syncSavedTripsAfterLogin();
        } catch (error) {
          console.log("Saved trip sync skipped or failed", error);
        }

        await loadTrips();
      };

      loadAndSyncTrips();
    }, [])
  );

  const handleDelete = (trip: SavedTrip) => {
    Alert.alert(
      "Delete Trip?",
      `${trip.riverName}: ${trip.start.name} to ${trip.end.name}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteSavedTrip(trip.id);
            loadTrips();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Loading saved trips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Trips</Text>

      {savedTrips.length === 0 ? (
        <Text style={styles.empty}>No saved trips yet.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {savedTrips.map((trip) => (
            <View key={trip.id} style={styles.card}>
              <Text style={styles.river}>
                {trip.riverName}, {trip.state}
              </Text>

              <Text style={styles.stat}>
                Start: {trip.start.name}
              </Text>

              <Text style={styles.stat}>
                End: {trip.end.name}
              </Text>

              <Text style={styles.stat}>
                Distance: {trip.distanceMiles.toFixed(1)} mi
              </Text>

              <Text style={styles.date}>
                Saved: {new Date(trip.createdAt).toLocaleDateString()}
              </Text>

              <TouchableOpacity
                style={styles.openButton}
                onPress={() => router.push(`/plan-trip?savedTripId=${trip.id}`)}
              >
                <Text style={styles.openText}>Open Trip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.startButton}
                onPress={() =>
                    router.push(`/plan-trip?savedTripId=${trip.id}&startTrip=true`)
                }
              >
                <Text style={styles.startText}>Start This Trip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(trip)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
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
  empty: {
    fontSize: 15,
    color: "#555",
  },
  list: {
    paddingBottom: 40,
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
    marginBottom: 8,
  },
  stat: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: "#777",
    marginTop: 8,
  },
  openButton: {
    marginTop: 12,
    backgroundColor: "#1CA7A6",
    padding: 10,
    borderRadius: 10,
  },
  openText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
  },
  startButton: {
    marginTop: 8,
    backgroundColor: "#0B7285",
    padding: 10,
    borderRadius: 10,
  },
  startText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: "#D9534F",
    padding: 10,
    borderRadius: 10,
  },
  deleteText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
  },
});