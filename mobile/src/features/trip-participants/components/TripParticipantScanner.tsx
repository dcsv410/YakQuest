import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";

import {
  resolveTripQrToken,
} from "../../../services/tripParticipantService";

import type {
  TripParticipant,
} from "../types";

type Props = {
  visible: boolean;
  existingParticipantIds: string[];
  onParticipantAdded: (
    participant: TripParticipant
  ) => void;
  onClose: () => void;
};

function extractToken(
  scannedValue: string
): string | null {
  try {
    const url = new URL(scannedValue);

    if (
      url.protocol !== "yakquest:"
      || url.hostname
        !== "trip-participant"
    ) {
      return null;
    }

    return url.searchParams.get(
      "token"
    );
  } catch {
    return null;
  }
}

export default function TripParticipantScanner({
  visible,
  existingParticipantIds,
  onParticipantAdded,
  onClose,
}: Props) {
  const [
    permission,
    requestPermission,
  ] = useCameraPermissions();

  const [
    resolving,
    setResolving,
  ] = useState(false);

  const [
    scanEnabled,
    setScanEnabled,
  ] = useState(true);

  const lastScannedValueRef =
    useRef<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setResolving(false);
      setScanEnabled(true);
      lastScannedValueRef.current =
        null;
      return;
    }

    if (
      permission
      && !permission.granted
      && permission.canAskAgain
    ) {
      requestPermission();
    }
  }, [
    visible,
    permission?.granted,
    permission?.canAskAgain,
  ]);

  const handleBarcodeScanned =
    async ({
      data,
    }: {
      data: string;
    }) => {
      if (
        resolving
        || !scanEnabled
        || lastScannedValueRef.current
          === data
      ) {
        return;
      }

      lastScannedValueRef.current =
        data;

      const token =
        extractToken(data);

      if (!token) {
        setScanEnabled(false);

        Alert.alert(
          "Not a YakQuest Trip Code",
          (
            "This QR code cannot be used "
            + "to add a paddler."
          ),
          [
            {
              text: "Scan Again",
              onPress: () => {
                lastScannedValueRef.current =
                  null;
                setScanEnabled(true);
              },
            },
          ]
        );

        return;
      }

      try {
        setResolving(true);
        setScanEnabled(false);

        const participant =
          await resolveTripQrToken(
            token
          );

        if (
          existingParticipantIds.includes(
            participant.userId
          )
        ) {
          Alert.alert(
            "Already Added",
            (
              `${participant.displayName} `
              + "is already on this trip."
            ),
            [
              {
                text: "OK",
                onPress: onClose,
              },
            ]
          );

          return;
        }

        onParticipantAdded(
          participant
        );

        Alert.alert(
          "Paddler Added",
          (
            `${participant.displayName} `
            + "will receive credit for "
            + "this trip after it is saved."
          ),
          [
            {
              text: "OK",
              onPress: onClose,
            },
          ]
        );
      } catch (error) {
        console.error(
          "Failed to resolve trip QR",
          error
        );

        Alert.alert(
            "Unable to Add Paddler",
            error instanceof TypeError
                ? (
                    "YakQuest could not reach the server. "
                    + "An internet connection is required "
                    + "to verify a paddler's QR code."
                )
                : error instanceof Error
                ? error.message
                : (
                    "The QR code could not be verified."
                    ),
            [
                {
                text: "Scan Again",
                onPress: () => {
                    lastScannedValueRef.current =
                    null;

                    setScanEnabled(true);
                },
                },
                {
                text: "Cancel",
                style: "cancel",
                onPress: onClose,
                },
            ]
            );
      } finally {
        setResolving(false);
      }
    };

  if (!permission) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>
          Add a Paddler
        </Text>

        <Text style={styles.instructions}>
          Scan the QR code from the
          other paddler&apos;s YakQuest
          account page.
        </Text>

        {!permission.granted ? (
          <View style={styles.permissionArea}>
            <Text
              style={
                styles.permissionText
              }
            >
              Camera permission is
              required to scan a trip
              QR code.
            </Text>

            {permission.canAskAgain && (
              <TouchableOpacity
                style={styles.mainButton}
                onPress={
                  requestPermission
                }
              >
                <Text
                  style={
                    styles.mainButtonText
                  }
                >
                  Allow Camera
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.cameraFrame}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={
                scanEnabled
                  ? handleBarcodeScanned
                  : undefined
              }
            />

            <View style={styles.scanBox} />

            {resolving && (
              <View
                style={
                  styles.loadingOverlay
                }
              >
                <ActivityIndicator
                  size="large"
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Verifying paddler...
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          disabled={resolving}
        >
          <Text style={styles.closeText}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10161C",
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },

  instructions: {
    marginTop: 10,
    marginBottom: 18,
    color: "#D7DEE5",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },

  cameraFrame: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },

  camera: {
    flex: 1,
  },

  scanBox: {
    position: "absolute",
    alignSelf: "center",
    top: "28%",
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 18,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  permissionArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  permissionText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },

  mainButton: {
    marginTop: 18,
    backgroundColor: "#1CA7A6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },

  mainButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  closeButton: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
  },

  closeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
});