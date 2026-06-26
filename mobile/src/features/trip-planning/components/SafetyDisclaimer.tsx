import React from "react";
import { Text, StyleSheet } from "react-native";

type Props = {
  compact?: boolean;
};

export default function SafetyDisclaimer({ compact = false }: Props) {
  return (
    <Text style={[styles.disclaimer, compact && styles.compact]}>
      YakQuest is for planning and informational purposes only. River
      conditions, hazards, access points, and water levels can change quickly
      and may be inaccurate or incomplete. You are responsible for your own
      safety, decisions, equipment, and route. Wear a PFD, use good judgment,
      respect private property, and do not paddle beyond your ability.
    </Text>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    marginTop: 18,
    fontSize: 12,
    color: "#555",
    lineHeight: 17,
    textAlign: "center",
  },
  compact: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 15,
  },
});