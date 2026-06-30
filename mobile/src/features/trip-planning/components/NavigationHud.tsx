import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RiverPoint } from "../../../data/types";
import { FEET_PER_MILE, formatDuration } from "@yakquest/shared";

type Props = {
  navigationArmed: boolean;
  distanceToEndFeet: number | null;
  nextPoint: RiverPoint | null;
  distanceToNextPointFeet: number | null;
  averageSpeedMph?: number;
  estimatedTimeRemainingMs?: number | null;
};

const feetToMiles = (feet: number) => feet / FEET_PER_MILE;

export default function NavigationHud({
  navigationArmed,
  distanceToEndFeet,
  nextPoint,
  distanceToNextPointFeet,
  averageSpeedMph,
  estimatedTimeRemainingMs
}: Props) {
  if (!navigationArmed) return null;

  return (
    <View style={styles.hud}>
      <Text style={styles.title}>🛶 Navigation Active</Text>

      {distanceToEndFeet != null && (
        <Text style={styles.stat}>
          Take-out: {feetToMiles(distanceToEndFeet).toFixed(2)} mi
        </Text>
      )}

      {nextPoint && distanceToNextPointFeet != null && (
        <Text style={styles.stat}>
          Next: {nextPoint.name} —{" "}
          {distanceToNextPointFeet < 528
            ? `${Math.round(distanceToNextPointFeet)} ft`
            : `${feetToMiles(distanceToNextPointFeet).toFixed(2)} mi`}
        </Text>
      )}

      <Text style={styles.stat}>
        Avg Speed: {(averageSpeedMph ?? 0).toFixed(1)} mph
      </Text>

      {estimatedTimeRemainingMs != null && (
        <Text style={styles.stat}>
          ETA at Current Pace: {formatDuration(estimatedTimeRemainingMs)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: "absolute",
    top: 55,
    left: 16,
    right: 16,
    backgroundColor: "rgba(20, 25, 35, 0.88)",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  stat: {
    color: "rgba(230, 242, 255, 0.95)",
    marginTop: 5,
    fontSize: 13,
  },
});