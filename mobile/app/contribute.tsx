import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from "react-native";

import { useLocalSearchParams } from "expo-router";

import { getAllRivers } from "../src/services/riverService";
import { useUserLocation } from "../src/features/trip-planning/hooks/useUserLocation";
import { useContributions } from "../src/features/contribute/hooks/useContributions";
import { River, RiverPointType } from "../src/data/types";
import { Contribution } from "../src/services/contributionService";

import {
  getNearestRiver,
} from "../src/features/trip-planning/utils/tripMath";

type ContributionMode =
  | "new-river"
  | "existing-river-point"
  | "remove-existing-point";

const pointTypes: {
  label: string;
  value: RiverPointType;
}[] = [
  { label: "Public Access", value: "public_access" },
  { label: "Private Access", value: "private_access" },
  { label: "Point of Interest", value: "poi" },
  { label: "Hazard", value: "hazard" },
];

const [showRiverList, setShowRiverList] = useState(false)

export default function ContributeScreen() {
  const params = useLocalSearchParams<{
    mode?: ContributionMode;
    riverId?: string;
    pointId?: string;
    pointName?: string;
  }>();
  const { location, permissionDenied } = useUserLocation();
  const {
    contributions,
    saveContribution,
    removeContribution,
    editContribution,
    retryContribution,
  } = useContributions();

  const [rivers, setRivers] = useState<River[]>([]);
  const [riversLoading, setRiversLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRivers() {
      try {
        const loadedRivers = await getAllRivers();

        if (isMounted) {
          setRivers(loadedRivers);
        }
      } catch (error) {
        console.error("Failed to load rivers", error);
      } finally {
        if (isMounted) {
          setRiversLoading(false);
        }
      }
    }

    loadRivers();

    return () => {
      isMounted = false;
    };
  }, []);

  const [mode, setMode] = useState<ContributionMode>("existing-river-point");

  const [selectedRiverId, setSelectedRiverId] = useState("");
  const selectedRiver = rivers.find((river) => river.id === selectedRiverId);
  const nearestRiver = location
    ? getNearestRiver(rivers, location, 1500)
    : null;

  const [newRiverName, setNewRiverName] = useState("");
  const [newRiverState, setNewRiverState] = useState("AL");
  const [newRiverDescription, setNewRiverDescription] = useState("");

  const [pointName, setPointName] = useState("");
  const [pointType, setPointType] = useState<RiverPointType>("poi");
  const [pointDescription, setPointDescription] = useState("");

  const [parking, setParking] = useState(false);
  const [restroom, setRestroom] = useState(false);
  const [camping, setCamping] = useState(false);

  const [editingContributionId, setEditingContributionId] = useState<string | null>(null);
  const [editingContributionNotes, setEditingContributionNotes] = useState("");

  const handleEditContribution = (item: Contribution) => {
    setEditingContributionId(item.id);
    setEditingContributionNotes(item.points[0]?.description || "");
  };

  const [removalReason, setRemovalReason] = useState("");
  const [targetPointId, setTargetPointId] = useState("");
  const [targetPointName, setTargetPointName] = useState("");

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

  const handleSaveContributionEdit = async (item: Contribution) => {
    const point = item.points[0];
    if (!point) return;

    await editContribution(item.id, {
      points: [
        {
          ...point,
          description: editingContributionNotes.trim() || undefined,
        },
      ],
    });

    setEditingContributionId(null);
    setEditingContributionNotes("");
  };

  const handleRetryContribution = async (item: Contribution) => {
    const submitted = await retryContribution(item.id);

    Alert.alert(
      submitted ? "Submitted" : "Still Pending",
      submitted
        ? "Your contribution was submitted for review."
        : "Your contribution is still saved locally and pending submission."
    );
  };

  const handleRemoveContribution = (item: Contribution) => {
    Alert.alert(
      "Remove Contribution?",
      `Remove "${item.points[0]?.name || item.riverName}" from your local contributions?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeContribution(item.id),
        },
      ]
    );
  };

  const resetForm = () => {
    setPointName("");
    setPointType("poi");
    setPointDescription("");
    setParking(false);
    setRestroom(false);
    setCamping(false);
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert("Location Needed", "GPS location is required.");
      return;
    }

    if (mode === "remove-existing-point") {
      if (!selectedRiver) {
        Alert.alert("Select River", "Please select the river this point belongs to.");
        return;
      }

      if (!targetPointId || !targetPointName) {
        Alert.alert("Missing Point", "Please select a point to remove.");
        return;
      }

      if (!removalReason.trim()) {
        Alert.alert("Removal Reason Required", "Please explain why this point should be removed.");
        return;
      }

      const result = await saveContribution({
        kind: "remove-existing-point",
        riverId: selectedRiver.id,
        riverName: selectedRiver.name,
        state: selectedRiver.state,
        targetPointId,
        targetPointName,
        removalReason: removalReason.trim(),
        points: [],
      });

      Alert.alert(
        "Removal Request Saved",
        result.submitted
          ? "Your removal request was submitted for review."
          : "Your removal request was saved locally and is pending review submission."
      );

      setRemovalReason("");
      setTargetPointId("");
      setTargetPointName("");
      return;
    }

    if (!pointName.trim()) {
      Alert.alert("Missing Point Name", "Please name this point.");
      return;
    }

    if (mode === "existing-river-point" && !selectedRiver) {
      Alert.alert("Select River", "Please select an existing river.");
      return;
    }

    if (mode === "new-river" && !newRiverName.trim()) {
      Alert.alert("Missing River Name", "Please enter a river name.");
      return;
    }

    const riverName =
      mode === "new-river" ? newRiverName.trim() : selectedRiver!.name;

    const state =
      mode === "new-river" ? newRiverState.trim().toUpperCase() : selectedRiver!.state;

    const pointId = `${state.toLowerCase()}-${riverName
      .toLowerCase()
      .replace(/\s+/g, "-")}-${pointName
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}`;

    const result = await saveContribution({
      kind: mode,
      riverId: mode === "existing-river-point" ? selectedRiver!.id : undefined,
      riverName,
      state,
      description:
        mode === "new-river" ? newRiverDescription.trim() : undefined,
      points: [
        {
          id: pointId,
          name: pointName.trim(),
          type: pointType,
          latitude: location.latitude,
          longitude: location.longitude,
          description: pointDescription.trim() || undefined,
          parking,
          restroom,
          camping,
        },
      ],
    });

    Alert.alert(
      "Contribution Saved",
      result.submitted
        ? "Your contribution was saved and submitted for review."
        : "Your contribution was saved locally and is pending review submission."
    );

    resetForm();
  };

  React.useEffect(() => {
    if (
      params.mode === "new-river" ||
      params.mode === "existing-river-point" ||
      params.mode === "remove-existing-point"
    ) {
      setMode(params.mode);
    }

    if (params.riverId) {
      setSelectedRiverId(params.riverId);
    }

    if (params.pointId) {
      setTargetPointId(params.pointId);
    }

    if (params.pointName) {
      setTargetPointName(String(params.pointName));
    }
  }, [params.mode, params.riverId, params.pointId, params.pointName]);

  if (permissionDenied) {
    return (
      <View style={styles.center}>
        <Text>Location permission is required to contribute points.</Text>
      </View>
    );
  }

  React.useEffect(() => {
    if (params.riverId) return;
    if (mode !== "existing-river-point") return;
    if (!nearestRiver?.river) return;

    setSelectedRiverId(nearestRiver.river.id);
  }, [params.riverId, mode, nearestRiver?.river?.id]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Contribute</Text>
      <Text style={styles.subtitle}>
        Add a point to an existing river or request a new river.
      </Text>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === "existing-river-point" && styles.modeButtonActive,
          ]}
          onPress={() => setMode("existing-river-point")}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === "existing-river-point" && styles.modeButtonTextActive,
            ]}
          >
            Current River
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === "new-river" && styles.modeButtonActive,
          ]}
          onPress={() => setMode("new-river")}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === "new-river" && styles.modeButtonTextActive,
            ]}
          >
            New River
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "existing-river-point" ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current River</Text>

          <Text style={styles.helperText}>
            YakQuest selected the nearest river based on your current GPS location.
          </Text>

          {selectedRiver ? (
            <View style={styles.selectedRiverCard}>
              <Text style={styles.selectedRiverName}>
                {selectedRiver.name}, {selectedRiver.state}
              </Text>

              {nearestRiver && (
                <Text style={styles.locationText}>
                  Nearest river path: {Math.round(nearestRiver.distanceFeet)} ft away
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.empty}>
              No nearby river found. Tap Change River to choose manually.
            </Text>
          )}

          <TouchableOpacity
            style={styles.changeRiverButton}
            onPress={() => setShowRiverList((current) => !current)}
          >
            <Text style={styles.changeRiverButtonText}>
              {showRiverList ? "Hide River List" : "Change River"}
            </Text>
          </TouchableOpacity>

          {showRiverList && (
            <View style={styles.riverList}>
              {rivers.map((river: River) => (
                <TouchableOpacity
                  key={river.id}
                  style={[
                    styles.riverOption,
                    selectedRiverId === river.id && styles.riverOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedRiverId(river.id);
                    setShowRiverList(false);
                  }}
                >
                  <Text
                    style={[
                      styles.riverOptionText,
                      selectedRiverId === river.id &&
                        styles.riverOptionTextActive,
                    ]}
                  >
                    {river.name}, {river.state}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>New River Request</Text>

          <TextInput
            value={newRiverName}
            onChangeText={setNewRiverName}
            placeholder="River name"
            placeholderTextColor="#777"
            style={styles.input}
          />

          <TextInput
            value={newRiverState}
            onChangeText={setNewRiverState}
            placeholder="State, e.g. AL"
            placeholderTextColor="#777"
            autoCapitalize="characters"
            style={styles.input}
          />

          <TextInput
            value={newRiverDescription}
            onChangeText={setNewRiverDescription}
            placeholder="Tell us about this river..."
            placeholderTextColor="#777"
            multiline
            style={styles.textArea}
          />
        </View>
      )}

      {mode === "remove-existing-point" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Suggest Point Removal</Text>

          <Text style={styles.helperText}>
            This does not remove the point immediately. An admin must review it first.
          </Text>

          <Text style={styles.selectedRiverName}>
            {targetPointName || "Selected point"}
          </Text>

          <TextInput
            value={removalReason}
            onChangeText={setRemovalReason}
            placeholder="Why should this point be removed?"
            placeholderTextColor="#777"
            multiline
            style={styles.textArea}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Removal Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode !== "remove-existing-point" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Point Details</Text>

          <TextInput
            value={pointName}
            onChangeText={setPointName}
            placeholder="Point name"
            placeholderTextColor="#777"
            style={styles.input}
          />

          <Text style={styles.label}>Point Type</Text>

          <View style={styles.typeGrid}>
            {pointTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  pointType === type.value && styles.typeButtonActive,
                ]}
                onPress={() => setPointType(type.value)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    pointType === type.value && styles.typeButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={pointDescription}
            onChangeText={setPointDescription}
            placeholder="Description"
            placeholderTextColor="#777"
            multiline
            style={styles.textArea}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Parking</Text>
            <Switch value={parking} onValueChange={setParking} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Restroom</Text>
            <Switch value={restroom} onValueChange={setRestroom} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Camping</Text>
            <Switch value={camping} onValueChange={setCamping} />
          </View>

          <Text style={styles.locationText}>
            GPS:{" "}
            {location
              ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
              : "Loading..."}
          </Text>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Save Contribution</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Local Contributions</Text>

        {contributions.length === 0 ? (
          <Text style={styles.empty}>No contributions yet.</Text>
        ) : (
          contributions.map((item) => (
            <View key={item.id} style={styles.contributionRow}>
              <View>
                <Text style={styles.contributionTitle}>{item.riverName}</Text>
                <Text style={styles.contributionMeta}>
                  {item.kind === "new-river"
                    ? "New River Request"
                    : "Existing River Point"}{" "}
                  • {item.status}
                </Text>

                {item.points.map((point) => (
                  <Text key={point.id} style={styles.contributionPoint}>
                    {point.name} ({getPointTypeLabel(point.type)})
                  </Text>
                ))}
              </View>

              {editingContributionId === item.id ? (
                <>
                  <TextInput
                    value={editingContributionNotes}
                    onChangeText={setEditingContributionNotes}
                    multiline
                    placeholder="Edit contribution description..."
                    placeholderTextColor="#777"
                    style={styles.textArea}
                  />

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => handleSaveContributionEdit(item)}
                  >
                    <Text style={styles.submitButtonText}>
                      Save Edit
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}

              <View style={styles.contributionActions}>
                {(item.status === "pending" ||
                  item.status === "failed") && (
                  <TouchableOpacity
                    style={styles.smallActionButton}
                    onPress={() => handleEditContribution(item)}
                  >
                    <Text style={styles.smallActionText}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                )}

                {item.status === "failed" && (
                  <TouchableOpacity
                    style={styles.smallActionButton}
                    onPress={() => handleRetryContribution(item)}
                  >
                    <Text style={styles.smallActionText}>
                      Retry
                    </Text>
                  </TouchableOpacity>
                )}

                {item.status !== "approved" && (
                  <TouchableOpacity
                    style={styles.smallDeleteButton}
                    onPress={() => handleRemoveContribution(item)}
                  >
                    <Text style={styles.smallDeleteText}>Remove</Text>
                  </TouchableOpacity>
                )}

                {item.status === "approved" && (
                  <Text style={styles.approvedNote}>
                    Approved contributions require admin review to remove.
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
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
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1CA7A6",
    padding: 12,
    borderRadius: 12,
  },
  modeButtonActive: {
    backgroundColor: "#1CA7A6",
  },
  modeButtonText: {
    textAlign: "center",
    color: "#1CA7A6",
    fontWeight: "700",
  },
  modeButtonTextActive: {
    color: "white",
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    color: "#111",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 10,
    minHeight: 90,
    marginTop: 8,
    color: "#111",
    textAlignVertical: "top",
  },
  label: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  typeButton: {
    borderWidth: 1,
    borderColor: "#1CA7A6",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  typeButtonActive: {
    backgroundColor: "#1CA7A6",
  },
  typeButtonText: {
    color: "#1CA7A6",
    fontWeight: "700",
    fontSize: 12,
  },
  typeButtonTextActive: {
    color: "white",
  },
  riverOption: {
    borderWidth: 1,
    borderColor: "#DDD",
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  riverOptionActive: {
    borderColor: "#1CA7A6",
    backgroundColor: "rgba(28,167,166,0.1)",
  },
  riverOptionText: {
    color: "#333",
    fontWeight: "600",
  },
  riverOptionTextActive: {
    color: "#0B7285",
  },
  switchRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 14,
    color: "#333",
  },
  locationText: {
    marginTop: 14,
    color: "#555",
    fontSize: 13,
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: "#1CA7A6",
    padding: 12,
    borderRadius: 12,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "800",
    textAlign: "center",
  },
  empty: {
    color: "#555",
  },
  contributionRow: {
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 12,
    marginTop: 12,
  },
  contributionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  contributionMeta: {
    marginTop: 3,
    fontSize: 12,
    color: "#777",
  },
  contributionPoint: {
    marginTop: 4,
    fontSize: 13,
    color: "#333",
  },
  removeButton: {
    alignSelf: "center",
    backgroundColor: "#D9534F",
    padding: 8,
    borderRadius: 10,
  },
  removeButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  helperText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  selectedRiverCard: {
    backgroundColor: "rgba(28,167,166,0.08)",
    borderWidth: 1,
    borderColor: "rgba(28,167,166,0.25)",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  selectedRiverName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B7285",
  },
  changeRiverButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#1CA7A6",
    padding: 10,
    borderRadius: 10,
  },
  changeRiverButtonText: {
    color: "#1CA7A6",
    textAlign: "center",
    fontWeight: "700",
  },
  riverList: {
    marginTop: 10,
  },
  contributionActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  smallActionButton: {
    backgroundColor: "#1CA7A6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  smallActionText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  smallDeleteButton: {
    backgroundColor: "#D9534F",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  smallDeleteText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
  approvedNote: {
    marginTop: 10,
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
  },
});