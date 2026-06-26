import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { River, RiverPoint } from "../../../data/types";

type Props = {
  selectedRiver: River | null;
  tripActive: boolean;
  navigationArmed: boolean;
  navigationTarget: RiverPoint | null;
  approachingPoint: RiverPoint | null;
  flowCfs: number | null;
  flowRating: string;
  riverLength: number;
  segmentMiles: number;
  selectMode: "start" | "end";
  start: RiverPoint | null;
  end: RiverPoint | null;
  time: { min: number; max: number } | null;
  onShowOverview: () => void;
  onOpenRiverList: () => void;  
};

export default function TripPanel({
  selectedRiver,
  tripActive,
  navigationArmed,
  navigationTarget,
  approachingPoint,
  flowCfs,
  flowRating,
  riverLength,
  segmentMiles,
  selectMode,
  start,
  end,
  time,
  onShowOverview,
  onOpenRiverList,
}: Props) {
  return (
    <View style={styles.panel}>
      {!selectedRiver ? (
        <>
          <Text style={styles.title}>Select a river</Text>
          <Text style={styles.stat}>
            Tap a river on the map or choose from the list.
          </Text>

          <TouchableOpacity style={styles.button} onPress={onOpenRiverList}>
            <Text style={styles.buttonText}>Choose From List</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>{selectedRiver.name}</Text>

          <TouchableOpacity style={styles.secondaryButton} onPress={onOpenRiverList}>
            <Text style={styles.secondaryButtonText}>Change River</Text>
          </TouchableOpacity>

          <Text style={styles.stat}>📍 State: {selectedRiver.stateName}</Text>
          <Text style={styles.stat}>🌊 Difficulty: {selectedRiver.difficulty}</Text>
          <Text style={styles.stat}>🧼 Cleanliness: {selectedRiver.cleanliness}</Text>
          <Text style={styles.stat}>🎣 Fishing: {selectedRiver.fishing}</Text>

          {tripActive && <Text style={styles.stat}>🛶 Trip Active</Text>}
          {navigationArmed && (
            <Text style={styles.stat}>✅ Navigation Armed</Text>
          )}

          {navigationTarget && (
            <Text style={styles.stat}>🚗 Navigating to {navigationTarget.name}</Text>
          )}

          {approachingPoint && (
            <Text style={styles.stat}>📍 Approaching {approachingPoint.name}</Text>
          )}

          <Text style={styles.stat}>
            💧 Flow: {flowCfs ? `${flowCfs} cfs` : selectedRiver.flow}
          </Text>

          <Text style={styles.stat}>📊 Conditions: {flowRating}</Text>
          <Text style={styles.stat}>📏 River: {riverLength.toFixed(1)} mi</Text>
          <Text style={styles.stat}>🧭 Trip: {segmentMiles.toFixed(1)} mi</Text>

          <Text style={styles.stat}>
            👉 {selectMode === "start" ? "Tap START point" : "Tap END point"}
          </Text>

          <Text style={styles.stat}>Start: {start?.name || "Not selected"}</Text>
          <Text style={styles.stat}>End: {end?.name || "Not selected"}</Text>

          {time && (
            <Text style={styles.stat}>
              ⏱ {time.min} – {time.max} hrs
            </Text>
          )}

          {start && end && (
            <TouchableOpacity style={styles.button} onPress={onShowOverview}>
              <Text style={styles.buttonText}>Trip Overview</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 20,
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
  secondaryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#1CA7A6",
    padding: 8,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: "#1CA7A6",
    textAlign: "center",
    fontWeight: "700",
  },
});