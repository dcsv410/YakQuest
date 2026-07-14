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
  Image,
} from "react-native";

import { useLocalSearchParams } from "expo-router";

import { getAllRivers } from "../src/services/riverService";
import { useUserLocation } from "../src/features/trip-planning/hooks/useUserLocation";
import { useContributions } from "../src/features/contribute/hooks/useContributions";
import {
  River,
  RiverPoint,
  RiverPointType,
} from "../src/data/types";
import { Contribution } from "../src/services/contributionService";
import { getCurrentUser } from "../src/services/authService";
import { pickContributionPhoto } from "../src/features/contribute/photoContribution";
import { getAllRiverPoints } from "@yakquest/shared";

import {
  getNearestRiver,
} from "../src/features/trip-planning/utils/tripMath";

type ContributionMode =
  | "new-river"
  | "existing-river-point"
  | "remove-existing-point"
  | "point-photo";

const pointTypes: {
  label: string;
  value: RiverPointType;
}[] = [
  { label: "Public Access", value: "public_access" },
  { label: "Private Access", value: "private_access" },
  { label: "Point of Interest", value: "poi" },
  { label: "Hazard", value: "hazard" },
];

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
  const [showRiverList, setShowRiverList] = useState(false)

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

  const [selectedPhotoPointId, setSelectedPhotoPointId] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");

  const selectedRiverPoints: RiverPoint[] = selectedRiver
    ? getAllRiverPoints(selectedRiver)
    : [];

  const selectedPhotoPoint = selectedRiverPoints.find(
    (point) => point.id === selectedPhotoPointId
  );

  const allGroupedPhotoPoints: {
    title: string;
    type: RiverPointType;
    symbol: string;
    points: RiverPoint[];
  }[] = [
    {
      title: "Public Access",
      type: "public_access",
      symbol: "🟢",
      points: selectedRiverPoints.filter(
        (point) => point.type === "public_access"
      ),
    },
    {
      title: "Private Access",
      type: "private_access",
      symbol: "🔵",
      points: selectedRiverPoints.filter(
        (point) => point.type === "private_access"
      ),
    },
    {
      title: "Points of Interest",
      type: "poi",
      symbol: "🟠",
      points: selectedRiverPoints.filter(
        (point) => point.type === "poi"
      ),
    },
    {
      title: "Hazards",
      type: "hazard",
      symbol: "🔴",
      points: selectedRiverPoints.filter(
        (point) => point.type === "hazard"
      ),
    },
  ];

  const groupedPhotoPoints =
    allGroupedPhotoPoints.filter(
      (group) => group.points.length > 0
    );

  const getPointTypeLabel = (type: string) => {
    switch (type) {
      case "poi":
        return "Point of Interest";

      case "public":
      case "public_access":
        return "Public Access";

      case "private":
      case "private_access":
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

  const handleChoosePhoto = async () => {
    const user = await getCurrentUser();

    if (!user) {
      Alert.alert(
        "Login Required",
        "Please sign in before uploading photos."
      );
      return;
    }

    const selectedPhotoUri = await pickContributionPhoto();

    if (!selectedPhotoUri) {
      return;
    }

    setPhotoUri(selectedPhotoUri);
  };

  const submitPhotoContribution = async () => {
    if (!selectedRiver) {
      Alert.alert(
        "Select River",
        "Please select the river containing this point."
      );
      return;
    }

    if (!selectedPhotoPoint) {
      Alert.alert(
        "Select Point",
        "Please select the point shown in the photo."
      );
      return;
    }

    if (!photoUri) {
      Alert.alert(
        "Choose Photo",
        "Please choose a photo before submitting."
      );
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      Alert.alert(
        "Login Required",
        "Please sign in before uploading photos."
      );
      return;
    }

    Alert.alert(
      "Confirm Photo Submission",
      `Please confirm that this photo is for:\n\n${selectedPhotoPoint.name}\n${selectedRiver.name}, ${selectedRiver.state}`,
      [
        {
          text: "Review Again",
          style: "cancel",
        },
        {
          text: "Submit Photo",
          onPress: async () => {
            try {
              const result = await saveContribution({
                kind: "point-photo",
                riverId: selectedRiver.id,
                riverName: selectedRiver.name,
                state: selectedRiver.state,
                points: [],
                targetPointId: selectedPhotoPoint.id,
                targetPointName: selectedPhotoPoint.name,
                photoUri,
                photoCaption: photoCaption.trim() || null,
              });

              Alert.alert(
                result.submitted
                  ? "Photo Submitted"
                  : "Photo Saved",
                result.submitted
                  ? "Thank you. Your photo was submitted and will appear after it is approved."
                  : "The photo was saved locally and will be submitted when a connection is available."
              );

              setPhotoUri(null);
              setPhotoCaption("");
            } catch (error) {
              console.error(
                "Failed to submit photo contribution",
                error
              );

              Alert.alert(
                "Submission Failed",
                "YakQuest could not save this photo contribution. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (mode === "point-photo") {
      await submitPhotoContribution();
      return;
    }

    if (mode === "remove-existing-point") {
      if (!selectedRiver) {
        Alert.alert(
          "Select River",
          "Please select the river this point belongs to."
        );
        return;
      }

      if (!targetPointId || !targetPointName) {
        Alert.alert(
          "Missing Point",
          "Please select a point to remove."
        );
        return;
      }

      if (!removalReason.trim()) {
        Alert.alert(
          "Removal Reason Required",
          "Please explain why this point should be removed."
        );
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

    if (!location) {
      Alert.alert(
        "Location Needed",
        permissionDenied
          ? "Location permission is required to add a new point."
          : "YakQuest is still determining your location. Please try again."
      );
      return;
    }

    if (!pointName.trim()) {
      Alert.alert(
        "Missing Point Name",
        "Please name this point."
      );
      return;
    }

    if (
      mode === "existing-river-point" &&
      !selectedRiver
    ) {
      Alert.alert(
        "Select River",
        "Please select an existing river."
      );
      return;
    }

    if (
      mode === "new-river" &&
      !newRiverName.trim()
    ) {
      Alert.alert(
        "Missing River Name",
        "Please enter a river name."
      );
      return;
    }

    const riverName =
      mode === "new-river"
        ? newRiverName.trim()
        : selectedRiver!.name;

    const state =
      mode === "new-river"
        ? newRiverState.trim().toUpperCase()
        : selectedRiver!.state;

    const pointId = `${state.toLowerCase()}-${riverName
      .toLowerCase()
      .replace(/\s+/g, "-")}-${pointName
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}`;

    const result = await saveContribution({
      kind: mode,
      riverId:
        mode === "existing-river-point"
          ? selectedRiver!.id
          : undefined,
      riverName,
      state,
      description:
        mode === "new-river"
          ? newRiverDescription.trim()
          : undefined,
      points: [
        {
          id: pointId,
          name: pointName.trim(),
          type: pointType,
          latitude: location.latitude,
          longitude: location.longitude,
          description:
            pointDescription.trim() || undefined,
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
      params.mode === "remove-existing-point" ||
      params.mode === "point-photo"
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
        Add a point, request a river, or upload a photo for an existing location.
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

        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === "point-photo" &&
              styles.modeButtonActive,
          ]}
          onPress={() => {
            setMode("point-photo");
            setShowRiverList(false);
          }}
        >
          <Text
            style={[
              styles.modeButtonText,
              mode === "point-photo" &&
                styles.modeButtonTextActive,
            ]}
          >
            Add Photo
          </Text>
        </TouchableOpacity>
      </View>

      {(
        mode === "existing-river-point" ||
        mode === "point-photo"
      ) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {mode === "point-photo"
              ? "Choose River"
              : "Current River"}
          </Text>

          <Text style={styles.helperText}>
            {mode === "point-photo"
              ? "Choose the river containing the point shown in your photo."
              : "YakQuest selected the nearest river based on your current GPS location."}
          </Text>

          {riversLoading ? (
            <Text style={styles.empty}>
              Loading rivers...
            </Text>
          ) : selectedRiver ? (
            <View style={styles.selectedRiverCard}>
              <Text style={styles.selectedRiverName}>
                {selectedRiver.name},{" "}
                {selectedRiver.state}
              </Text>

              {mode === "existing-river-point" &&
                nearestRiver && (
                  <Text style={styles.locationText}>
                    Nearest river path:{" "}
                    {Math.round(
                      nearestRiver.distanceFeet
                    )}{" "}
                    ft away
                  </Text>
                )}
            </View>
          ) : (
            <Text style={styles.empty}>
              {mode === "point-photo"
                ? "Choose a river to view its points."
                : "No nearby river found. Tap Change River to choose manually."}
            </Text>
          )}

          <TouchableOpacity
            style={styles.changeRiverButton}
            onPress={() =>
              setShowRiverList(
                (current) => !current
              )
            }
          >
            <Text
              style={styles.changeRiverButtonText}
            >
              {showRiverList
                ? "Hide River List"
                : selectedRiver
                  ? "Change River"
                  : "Choose River"}
            </Text>
          </TouchableOpacity>

          {showRiverList && (
            <View style={styles.riverList}>
              {rivers.map((river: River) => (
                <TouchableOpacity
                  key={river.id}
                  style={[
                    styles.riverOption,
                    selectedRiverId === river.id &&
                      styles.riverOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedRiverId(river.id);
                    setSelectedPhotoPointId("");
                    setPhotoUri(null);
                    setPhotoCaption("");
                    setShowRiverList(false);
                  }}
                >
                  <Text
                    style={[
                      styles.riverOptionText,
                      selectedRiverId ===
                        river.id &&
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
      )}

      {mode === "new-river" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            New River Request
          </Text>

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
            onChangeText={
              setNewRiverDescription
            }
            placeholder="Tell us about this river..."
            placeholderTextColor="#777"
            multiline
            style={styles.textArea}
          />
        </View>
      )}

      {mode === "point-photo" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Choose Point
          </Text>

          <Text style={styles.helperText}>
            Select the access point, point of
            interest, or hazard shown in the
            photo.
          </Text>

          {!selectedRiver ? (
            <Text style={styles.empty}>
              Choose a river first.
            </Text>
          ) : selectedRiverPoints.length === 0 ? (
            <Text style={styles.empty}>
              No points are currently listed for
              this river.
            </Text>
          ) : (
            <View style={styles.groupedPointList}>
              {groupedPhotoPoints.map((group) => (
                <View
                  key={group.type}
                  style={styles.pointGroup}
                >
                  <View
                    style={styles.pointGroupHeader}
                  >
                    <Text
                      style={styles.pointGroupSymbol}
                    >
                      {group.symbol}
                    </Text>

                    <Text
                      style={styles.pointGroupTitle}
                    >
                      {group.title}
                    </Text>
                  </View>

                  {group.points.map((point) => {
                    const isSelected =
                      selectedPhotoPointId ===
                      point.id;

                    return (
                      <TouchableOpacity
                        key={point.id}
                        style={[
                          styles.pointOption,
                          isSelected &&
                            styles.pointOptionActive,
                        ]}
                        onPress={() => {
                          setSelectedPhotoPointId(
                            point.id
                          );

                          setPhotoUri(null);
                          setPhotoCaption("");
                        }}
                      >
                        <View
                          style={
                            styles.pointOptionContent
                          }
                        >
                          <Text
                            style={[
                              styles.pointOptionName,
                              isSelected &&
                                styles.pointOptionNameActive,
                            ]}
                          >
                            {point.name}
                          </Text>

                          {point.description ? (
                            <Text
                              style={
                                styles.pointOptionDescription
                              }
                              numberOfLines={2}
                            >
                              {point.description}
                            </Text>
                          ) : null}
                        </View>

                        <View
                          style={[
                            styles.selectionCircle,
                            isSelected &&
                              styles.selectionCircleActive,
                          ]}
                        >
                          {isSelected ? (
                            <Text
                              style={
                                styles.selectionCheck
                              }
                            >
                              ✓
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {selectedPhotoPoint && (
            <View style={styles.photoSection}>
              <Text style={styles.photoStepLabel}>
                Photo for{" "}
                {selectedPhotoPoint.name}
              </Text>

              <View
                style={styles.photoDestinationCard}
              >
                <Text
                  style={
                    styles.photoDestinationLabel
                  }
                >
                  Selected location
                </Text>

                <Text
                  style={
                    styles.photoDestinationName
                  }
                >
                  {selectedPhotoPoint.name}
                </Text>

                <Text
                  style={
                    styles.photoDestinationMeta
                  }
                >
                  {getPointTypeLabel(
                    selectedPhotoPoint.type
                  )}{" "}
                  • {selectedRiver?.name}
                </Text>
              </View>

              {photoUri ? (
                <View style={styles.photoPreviewCard}>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photoPreview}
                    resizeMode="contain"
                  />

                  <Text
                    style={styles.photoReviewText}
                  >
                    Review the image carefully.
                    Make sure this is the correct
                    photo for the selected point.
                  </Text>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleChoosePhoto}
                  >
                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      Choose a Different Photo
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleChoosePhoto}
                >
                  <Text
                    style={
                      styles.secondaryButtonText
                    }
                  >
                    Choose Photo
                  </Text>
                </TouchableOpacity>
              )}

              <TextInput
                value={photoCaption}
                onChangeText={setPhotoCaption}
                placeholder="Optional caption"
                placeholderTextColor="#777"
                multiline
                maxLength={500}
                style={styles.textArea}
              />

              {photoUri ? (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={submitPhotoContribution}
                >
                  <Text
                    style={
                      styles.submitButtonText
                    }
                  >
                    Submit This Photo
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
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

      {mode !== "remove-existing-point" &&
        mode !== "point-photo" && (
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

            {permissionDenied ? (
              <Text style={styles.permissionWarning}>
                Location permission is required to add
                a new point. Photo contributions do not
                require location access.
              </Text>
            ) : null}

            <Text style={styles.locationText}>
              GPS:{" "}
              {location
                ? `${location.latitude.toFixed(
                    5
                  )}, ${location.longitude.toFixed(5)}`
                : permissionDenied
                  ? "Permission not granted"
                  : "Loading..."}
            </Text>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Save Contribution</Text>
            </TouchableOpacity>
          </View>
        )
      }

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
                    : item.kind === "point-photo"
                      ? "Point Photo"
                      : item.kind ===
                          "remove-existing-point"
                        ? "Point Removal Request"
                        : "Existing River Point"}{" "}
                  • {item.status}
                </Text>

                {item.points.map((point) => (
                  <Text key={point.id} style={styles.contributionPoint}>
                    {point.name} ({getPointTypeLabel(point.type)})
                  </Text>
                ))}
                {item.kind === "point-photo" &&
                  item.targetPointName && (
                    <Text
                      style={styles.contributionPoint}
                    >
                      Photo for {item.targetPointName}
                    </Text>
                  )}
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
                {item.kind !== "point-photo" &&
                  (item.status === "pending" ||
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
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  modeButton: {
    flexGrow: 1,
    flexBasis: "30%",
    borderWidth: 1,
    borderColor: "#1CA7A6",
    paddingVertical: 12,
    paddingHorizontal: 8,
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
  groupedPointList: {
    marginTop: 8,
    gap: 16,
  },

  pointGroup: {
    gap: 8,
  },

  pointGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingBottom: 3,
  },

  pointGroupSymbol: {
    fontSize: 14,
  },

  pointGroupTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#333",
  },

  pointOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DDE2E7",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FAFBFC",
  },

  pointOptionActive: {
    borderColor: "#1CA7A6",
    backgroundColor: "rgba(28,167,166,0.08)",
  },

  pointOptionContent: {
    flex: 1,
    paddingRight: 12,
  },

  pointOptionName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },

  pointOptionNameActive: {
    color: "#0B7285",
  },

  pointOptionDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "#666",
  },

  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#C8CED4",
    alignItems: "center",
    justifyContent: "center",
  },

  selectionCircleActive: {
    borderColor: "#1CA7A6",
    backgroundColor: "#1CA7A6",
  },

  selectionCheck: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
  },

  photoSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E8EBEE",
    paddingTop: 16,
  },

  photoStepLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
    marginBottom: 10,
  },

  photoDestinationCard: {
    borderWidth: 1,
    borderColor: "rgba(28,167,166,0.3)",
    backgroundColor: "rgba(28,167,166,0.07)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  photoDestinationLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#667",
    textTransform: "uppercase",
  },

  photoDestinationName: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: "#0B7285",
  },

  photoDestinationMeta: {
    marginTop: 3,
    fontSize: 12,
    color: "#555",
  },

  photoPreviewCard: {
    borderWidth: 1,
    borderColor: "#DDE2E7",
    backgroundColor: "#F7F8FA",
    borderRadius: 14,
    padding: 10,
  },

  photoPreview: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    backgroundColor: "#111",
  },

  photoReviewText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: "#555",
  },

  secondaryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#1CA7A6",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  secondaryButtonText: {
    color: "#1CA7A6",
    fontWeight: "800",
    textAlign: "center",
  },

  permissionWarning: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E6A700",
    backgroundColor: "#FFF8DC",
    color: "#745500",
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
    lineHeight: 18,
  },
});