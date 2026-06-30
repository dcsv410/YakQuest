import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { River, RiverPoint } from "../../../data/types";

type TimelineItem = {
  name: string;
  miles: number;
};

type Props = {
  selectedRiver: River;
  start: RiverPoint;
  end: RiverPoint;
  flowCfs: number | null;
  flowRating: string;
  segmentMiles: number;
  time: { min: number; max: number } | null;
  timeline: TimelineItem[];
  onOpenMaps: (point: RiverPoint) => void;
  onResetTrip: () => void;
  onStartTrip: () => void;
  onSaveTrip: () => void;
};

export default function TripOverview({
  selectedRiver,
  start,
  end,
  flowCfs,
  flowRating,
  segmentMiles,
  time,
  timeline,
  onOpenMaps,
  onResetTrip,
  onStartTrip,
  onSaveTrip,
}: Props) {
  return (
    <View style={styles.overview}>
      <ScrollView contentContainerStyle={styles.overviewContent}>
        <Text style={styles.title}>
          Trip Overview - {selectedRiver.name}
        </Text>

        <Text style={styles.sectionTitle}>River Info</Text>

        <Text style={styles.stat}>State: {selectedRiver.stateName}</Text>
        <Text style={styles.stat}>Difficulty: {selectedRiver.difficulty}</Text>
        <Text style={styles.stat}>Cleanliness: {selectedRiver.cleanliness}</Text>
        <Text style={styles.stat}>Fishing: {selectedRiver.fishing}</Text>

        <Text style={styles.stat}>
          Flow: {flowCfs ? `${flowCfs} cfs` : "Uknown"}
        </Text>

        <Text style={styles.stat}>Conditions: {flowRating}</Text>

        <Text style={styles.sectionTitle}>Route</Text>

        <TouchableOpacity onPress={() => onOpenMaps(start)}>
          <Text style={styles.link}>Start: {start.name}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onOpenMaps(end)}>
          <Text style={styles.link}>End: {end.name}</Text>
        </TouchableOpacity>

        <Text style={styles.stat}>
          📏 Distance: {segmentMiles.toFixed(1)} miles
        </Text>

        {time && (
          <Text style={styles.stat}>
            ⏱ Estimated Time: {time.min} – {time.max} hrs
          </Text>
        )}

        <Text style={styles.sectionTitle}>Timeline</Text>

        {timeline.map((t, i) => (
          <Text key={i} style={styles.stat}>
            {t.miles.toFixed(1)} mi — {t.name}
          </Text>
        ))}

        <TouchableOpacity style={styles.button} onPress={onResetTrip}>
          <Text style={styles.buttonText}>Reset Trip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onSaveTrip}>
          <Text style={styles.buttonText}>Save Trip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onStartTrip}>
          <Text style={styles.buttonText}>Start Trip</Text>
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
  sectionTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
  },
  stat: {
    marginTop: 6,
    fontSize: 13,
    color: "#333",
  },
  link: {
    marginTop: 6,
    fontSize: 14,
    color: "#007AFF",
    textDecorationLine: "underline",
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