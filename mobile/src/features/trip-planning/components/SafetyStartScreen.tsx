import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import SafetyDisclaimer from "./SafetyDisclaimer";

type FlowLevel = string | null | undefined;

type Props = {
  visible: boolean;
  flowLevel: FlowLevel;
  onStart: () => void;
};

const getFlowConfig = (flowLevel: FlowLevel) => {
  const level = String(flowLevel || "").toLowerCase();

  if (level.includes("ideal")) {
    return {
      label: "RIVER FLOW CONDITIONS: IDEAL",
      message: "Water level is ideal. Have fun!",
      color: "#2EAD4B",
    };
  }

  if (level.includes("low")) {
    return {
      label: "RIVER FLOW CONDITIONS: LOW",
      message: "Some paddling experience is advised.",
      color: "#D6A700",
    };
  }

  if (level.includes("high") && !level.includes("danger")) {
    return {
      label: "RIVER FLOW CONDITIONS: HIGH",
      message: "Some paddling experience is advised.",
      color: "#D6A700",
    };
  }

  if (level.includes("danger") || level.includes("very high")) {
    return {
      label: "RIVER FLOW CONDITIONS: DANGEROUSLY HIGH",
      message: "Danger: water is very high. Consider rescheduling your trip.",
      color: "#C62828",
    };
  }

  return {
    label: "RIVER FLOW CONDITIONS: UNKNOWN",
    message: "Check current conditions before paddling.",
    color: "#555",
  };
};

const safetyItems = [
  "Always wear a PFD",
  "Watch for hazards and changing conditions",
  "Leave no trash behind",
  "Respect wildlife and private property",
  "Pack snacks and water",
  "Use sunscreen",
  "Avoid paddling alone",
  "Tell someone your route and expected return time",
  "Be prepared for the unexpected",
];

export default function SafetyStartScreen({
  visible,
  flowLevel,
  onStart,
}: Props) {
  const flow = getFlowConfig(flowLevel);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={[styles.banner, { backgroundColor: flow.color }]}>
          <Text style={styles.bannerText}>{flow.label}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.message}>{flow.message}</Text>

          <View style={styles.card}>
            {safetyItems.map((item) => (
              <View key={item} style={styles.checkRow}>
                <View style={styles.checkBox}>
                  <Text style={styles.check}>✓</Text>
                </View>
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <SafetyDisclaimer />
        </ScrollView>

        <TouchableOpacity style={styles.startButton} onPress={onStart}>
          <Text style={styles.startText}>Start Paddling</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  banner: {
    paddingTop: 58,
    paddingBottom: 22,
    paddingHorizontal: 18,
  },
  bannerText: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  content: {
    padding: 18,
    paddingBottom: 120,
  },
  message: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 18,
    color: "#222",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#1CA7A6",
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    color: "#1CA7A6",
    fontSize: 18,
    fontWeight: "900",
  },
  checkText: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    fontWeight: "600",
  },
  disclaimer: {
    marginTop: 18,
    fontSize: 12,
    color: "#555",
    lineHeight: 17,
    textAlign: "center",
  },
  startButton: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 34,
    backgroundColor: "#1CA7A6",
    borderRadius: 18,
    paddingVertical: 16,
  },
  startText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
});