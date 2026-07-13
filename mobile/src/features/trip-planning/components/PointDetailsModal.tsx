import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { RiverPoint, River } from "@yakquest/shared";
import { submitPointPhotoContribution } from "../../contribute/submitPointPhotoContribution";
import { useState } from "react";

type Props = {
  visible: boolean;
  point: RiverPoint | null;
  river: River | null;
  onClose: () => void;
  onSuggestRemoval?: () => void;
};

export function PointDetailsModal({
  visible,
  point,
  river,
  onClose,
  onSuggestRemoval,
}: Props) {
  if (!point || !river) return null;

  const photos = point.photos ?? [];
  const [fullSizePhoto, setFullSizePhoto] = useState<string | null>(null);

  return (
    <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
    >
        <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
            <ScrollView>
            <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.title}>{point.name}</Text>
            <Text style={styles.type}>{point.type}</Text>

            {point.description ? (
                <Text style={styles.description}>{point.description}</Text>
            ) : null}

            {photos.length ? (
                <View style={styles.photos}>
                {photos.slice(0, 3).map((photo, index) => {
                    const uri = photo;
                    if (!uri) return null;

                    return (
                    <TouchableOpacity
                        key={`${uri}-${index}`}
                        onPress={() => setFullSizePhoto(uri)}
                    >
                        <Image source={{ uri }} style={styles.photo} />
                    </TouchableOpacity>
                    );
                })}
                </View>
            ) : null}

            <TouchableOpacity
                style={styles.button}
                onPress={() =>
                submitPointPhotoContribution({
                    riverId: river.id,
                    riverName: river.name,
                    state: river.state,
                    pointId: point.id,
                    pointName: point.name,
                })
                }
            >
                <Text style={styles.buttonText}>Add Photo</Text>
            </TouchableOpacity>

            {onSuggestRemoval ? (
                <TouchableOpacity
                style={styles.dangerButton}
                onPress={onSuggestRemoval}
                >
                <Text style={styles.buttonText}>Suggest Removal</Text>
                </TouchableOpacity>
            ) : null}
            </ScrollView>
        </Pressable>
        </Pressable>
        <Modal
            visible={!!fullSizePhoto}
            transparent
            animationType="fade"
            onRequestClose={() => setFullSizePhoto(null)}
            >
            <Pressable
                style={styles.fullImageBackdrop}
                onPress={() => setFullSizePhoto(null)}
            >
                {fullSizePhoto ? (
                <Image
                    source={{ uri: fullSizePhoto }}
                    style={styles.fullImage}
                    resizeMode="contain"
                />
                ) : null}
            </Pressable>
        </Modal>
    </Modal>
    );
}

const styles = {
  backdrop: {
    flex: 1,
    justifyContent: "flex-end" as const,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    maxHeight: "75%" as const,
    backgroundColor: "#172033",
    padding: 18,
    paddingBottom: 42,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "700" as const,
  },
  type: {
    color: "#a8d5ff",
    marginTop: 4,
    marginBottom: 10,
  },
  description: {
    color: "white",
    marginBottom: 12,
  },
  photos: {
    flexDirection: "row" as const,
    gap: 8,
    marginVertical: 12,
  },
  photo: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  button: {
    backgroundColor: "#2f80ed",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  dangerButton: {
    backgroundColor: "#b84545",
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  closeButton: {
    padding: 12,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center" as const,
    fontWeight: "700" as const,
  },
  closeText: {
    color: "white",
    textAlign: "center" as const,
  },
  closeIcon: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    zIndex: 10,
    padding: 8,
  },
  closeIconText: {
    color: "white",
    fontSize: 22,
    fontWeight: "700" as const,
  },
  fullImageBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 16,
    paddingBottom: 48,
  },
  fullImage: {
    width: "100%" as const,
    height: "85%" as const,
  },
};