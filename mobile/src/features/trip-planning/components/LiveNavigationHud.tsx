import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { River, RiverPoint } from "../../../data/types";
import { FEET_PER_MILE } from "@yakquest/shared";

type Props = {
  river: River | null;
  distanceFromRiverFeet: number | null;
  nextPoint: RiverPoint | null;
  distanceToNextPointFeet: number | null;
  averageSpeedMph?: number;
};

const feetToMiles = (feet: number) => feet / FEET_PER_MILE;

const formatDistance = (feet: number) => {
  if (feet < 528) return `${Math.round(feet)} ft`;
  return `${feetToMiles(feet).toFixed(2)} mi`;
};

const getPointTypeLabel = (type: string) => {
  switch (type) {
    case "poi":
      return "Point of Interest";
    case "public":
      return "Public Access";
    case "private":
      return "Private Access";
    default:
      return type;
  }
};

export default function LiveNavigationHud({
  river,
  distanceFromRiverFeet,
  nextPoint,
  distanceToNextPointFeet,
  averageSpeedMph,
}: Props) {
  return (
    <View style={styles.hud}>
      <Text style={styles.title}>🧭 Live Navigation</Text>

      <Text style={styles.stat}>
        Avg Speed: {(averageSpeedMph ?? 0).toFixed(1)} mph
      </Text>

      {!river ? (
        <Text style={styles.stat}>
          Looking for a nearby river...
        </Text>
      ) : (
        <>
          <Text style={styles.stat}>
            River: {river.name}
          </Text>

          {distanceFromRiverFeet != null && (
            <Text style={styles.stat}>
              From river path: {Math.round(distanceFromRiverFeet)} ft
            </Text>
          )}

          {nextPoint && distanceToNextPointFeet != null ? (
            <>
              <Text style={styles.section}>Next Point</Text>

              <Text style={styles.pointName}>
                {nextPoint.name}
              </Text>

              <Text style={styles.stat}>
                {getPointTypeLabel(nextPoint.type)}
              </Text>

              <Text style={styles.stat}>
                Distance: {formatDistance(distanceToNextPointFeet)}
              </Text>

              {nextPoint.description ? (
                <Text style={styles.description}>
                  {nextPoint.description}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.stat}>
              No upcoming points found.
            </Text>
          )}
        </>
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
  section: {
    marginTop: 10,
    color: "rgba(230, 242, 255, 0.75)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  pointName: {
    marginTop: 4,
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  stat: {
    color: "rgba(230, 242, 255, 0.95)",
    marginTop: 5,
    fontSize: 13,
  },
  description: {
    color: "rgba(230, 242, 255, 0.95)",
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
});