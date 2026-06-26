import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";

import { useContributions } from "../src/features/contribute/hooks/useContributions";

const getPointTypeLabel = (type: string) => {
  switch (type) {
    case "poi":
      return "Point of Interest";
    case "public":
      return "Public Access";
    case "private":
      return "Private Access";
    case "hazard":
      return "Hazard";
    default:
      return type;
  }
};

export default function AdminReviewScreen() {
  const {
    reviewableContributions,
    loadReviewableContributions,
    approve,
    reject,
  } = useContributions();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  useEffect(() => {
    loadReviewableContributions();
  }, [loadReviewableContributions]);

  const handleApprove = (id: string) => {
    Alert.alert("Approve Contribution?", "This will mark it as approved.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: () => approve(id),
      },
    ]);
  };

  const handleReject = (id: string) => {
    if (!rejectNotes.trim()) {
      Alert.alert("Review Notes Required", "Please explain why it was rejected.");
      return;
    }

    reject(id, rejectNotes.trim());
    setRejectingId(null);
    setRejectNotes("");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin Review</Text>
      <Text style={styles.subtitle}>Review local contribution submissions.</Text>

      {reviewableContributions.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.empty}>No contributions waiting for review.</Text>
        </View>
      ) : (
        reviewableContributions.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.river}>{item.riverName}, {item.state}</Text>

            <Text style={styles.meta}>
              {item.kind === "new-river"
                ? "New River Request"
                : item.kind === "remove-existing-point"
                ? "Point Removal Request"
                : "Existing River Point"}{" "}
              • {item.status}
            </Text>

            <Text style={styles.meta}>
              Submitted: {new Date(item.createdAt).toLocaleDateString()}
            </Text>

            {item.description ? (
              <Text style={styles.description}>{item.description}</Text>
            ) : null}

            {item.kind === "remove-existing-point" ? (
              <View style={styles.pointBox}>
                <Text style={styles.pointName}>
                  Remove: {item.targetPointName || "Unknown point"}
                </Text>

                <Text style={styles.meta}>
                  Removal Request
                </Text>

                {item.removalReason ? (
                  <Text style={styles.description}>
                    Reason: {item.removalReason}
                  </Text>
                ) : (
                  <Text style={styles.description}>
                    No removal reason provided.
                  </Text>
                )}
              </View>
            ) : (
              item.points.map((point) => (
                <View key={point.id} style={styles.pointBox}>
                  <Text style={styles.pointName}>{point.name}</Text>

                  <Text style={styles.meta}>
                    {getPointTypeLabel(point.type)}
                  </Text>

                  <Text style={styles.meta}>
                    GPS: {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                  </Text>

                  {point.description ? (
                    <Text style={styles.description}>
                      {point.description}
                    </Text>
                  ) : null}

                  <Text style={styles.meta}>
                    Parking: {point.parking ? "Yes" : "No"} • Restroom:{" "}
                    {point.restroom ? "Yes" : "No"} • Camping:{" "}
                    {point.camping ? "Yes" : "No"}
                  </Text>
                </View>
              ))
            )}

            {rejectingId === item.id ? (
              <>
                <TextInput
                  value={rejectNotes}
                  onChangeText={setRejectNotes}
                  multiline
                  placeholder="Why is this rejected?"
                  placeholderTextColor="#777"
                  style={styles.textArea}
                />

                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleReject(item.id)}
                >
                  <Text style={styles.buttonText}>Confirm Reject</Text>
                </TouchableOpacity>
              </>
            ) : null}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApprove(item.id)}
              >
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => setRejectingId(item.id)}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#555",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  river: {
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    marginTop: 5,
    fontSize: 13,
    color: "#666",
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    color: "#333",
    lineHeight: 19,
  },
  pointBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(28,167,166,0.08)",
    borderWidth: 1,
    borderColor: "rgba(28,167,166,0.2)",
  },
  pointName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B7285",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 10,
    minHeight: 80,
    marginTop: 12,
    color: "#111",
    textAlignVertical: "top",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#1CA7A6",
    padding: 12,
    borderRadius: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#D9534F",
    padding: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "800",
    textAlign: "center",
  },
  empty: {
    color: "#555",
    fontSize: 14,
  },
});