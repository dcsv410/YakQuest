import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import QRCode from "react-native-qrcode-svg";

import {
  createTripQrToken,
} from "../../../services/tripParticipantService";

import type {
  TripParticipantQrToken,
} from "../types";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function TripQrModal({
  visible,
  onClose,
}: Props) {
  const [
    qrToken,
    setQrToken,
  ] = useState<
    TripParticipantQrToken | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const loadQrToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const result =
        await createTripQrToken();

      setQrToken(result);
    } catch (loadError) {
      console.error(
        "Failed to load trip QR token",
        loadError
      );

      setQrToken(null);

      setError(
        loadError instanceof Error
          ? loadError.message
          : (
              "Unable to create your "
              + "trip QR code."
            )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      setQrToken(null);
      setError(null);
      return;
    }

    loadQrToken();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            My Trip QR Code
          </Text>

          <Text style={styles.instructions}>
            Have the trip navigator scan
            this code before paddling begins.
          </Text>

          {loading && (
            <View style={styles.loadingArea}>
              <ActivityIndicator
                size="large"
                color="#1CA7A6"
              />

              <Text style={styles.statusText}>
                Creating secure QR code...
              </Text>
            </View>
          )}

          {!loading && error && (
            <View style={styles.errorArea}>
              <Text style={styles.errorText}>
                {error}
              </Text>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={loadQrToken}
              >
                <Text
                  style={
                    styles.refreshButtonText
                  }
                >
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && qrToken && (
            <>
              <Text style={styles.name}>
                {qrToken.displayName}
              </Text>

              <View style={styles.qrContainer}>
                <QRCode
                  value={qrToken.qrValue}
                  size={230}
                  backgroundColor="#FFFFFF"
                  color="#111111"
                />
              </View>

              <Text style={styles.expiration}>
                This code expires after
                10 minutes.
              </Text>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={loadQrToken}
              >
                <Text
                  style={
                    styles.refreshButtonText
                  }
                >
                  Refresh Code
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#182028",
  },

  instructions: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    color: "#4A535C",
  },

  name: {
    marginTop: 18,
    marginBottom: 14,
    fontSize: 18,
    fontWeight: "800",
    color: "#182028",
  },

  qrContainer: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D9DEE4",
  },

  expiration: {
    marginTop: 14,
    fontSize: 13,
    color: "#68727C",
  },

  loadingArea: {
    minHeight: 300,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  statusText: {
    color: "#4A535C",
  },

  errorArea: {
    minHeight: 250,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    textAlign: "center",
    color: "#A42C2C",
    lineHeight: 20,
  },

  refreshButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#1CA7A6",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 20,
  },

  refreshButtonText: {
    color: "#1A7777",
    fontWeight: "800",
  },

  closeButton: {
    marginTop: 18,
    width: "100%",
    backgroundColor: "#1CA7A6",
    borderRadius: 12,
    paddingVertical: 14,
  },

  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
});