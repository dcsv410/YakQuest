import { View, Text, StyleSheet, Pressable, ImageBackground, Modal } from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { getSavedTripCount } from "../src/services/savedTripService";
import Feather from "@expo/vector-icons/Feather";



export default function Home() {
  const [savedTripCount, setSavedTripCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const loadCount = async () => {
        const count = await getSavedTripCount();
        setSavedTripCount(count);
      };

      loadCount();
    }, [])
  );

  return (
    <ImageBackground
      source={require("../images/main-page.png")}
      style={styles.bg}
    >
      <View style={styles.overlay} />

      <Pressable
        style={styles.menuButton}
        onPress={() => setMenuOpen(true)}
      >
        <Feather
          name="menu"
          size={24}
          color="#fff"
        />
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.menuPanel}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push("/account");
              }}
            >
              <Text style={styles.menuItemText}>Account</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push("/about");
              }}
            >
              <Text style={styles.menuItemText}>About</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.adminHotspotWrapper}>
        <Pressable
          style={styles.adminHotspot}
          onLongPress={() => router.push("/admin-review")}
        />
      </View>

      {/* <View style={styles.container}></View> */}

      {/* This pushes content to bottom */}
      <View style={styles.container}>
        <View style={styles.spacer} />

        <View style={styles.cardContainer}>
          <Pressable onPress={() => router.push("/plan-trip")}>
            <BlurView intensity={25} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>🌊 Plan a Trip</Text>
              <Text style={styles.cardText}>Find rivers & float routes</Text>
            </BlurView>
          </Pressable>

          <Pressable onPress={() => router.push("/saved-trips")}>
            <BlurView intensity={25} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>
                💾 Saved Trips
                {savedTripCount > 0 ? ` (${savedTripCount})` : ""}
              </Text>
              <Text style={styles.cardText}>
                Reopen your favorite routes
              </Text>
            </BlurView>
          </Pressable>

          <Pressable onPress={() => router.push("/trip-history")}>
            <BlurView intensity={25} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>📜 Trip History</Text>
              <Text style={styles.cardText}>View completed paddles</Text>
            </BlurView>
          </Pressable>

          <Pressable onPress={() => router.push("/navigate")}>
            <BlurView intensity={25} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>🧭 Navigate</Text>
              <Text style={styles.cardText}>Live river tracking</Text>
            </BlurView>
          </Pressable>

          <Pressable onPress={() => router.push("/contribute")}>
            <BlurView intensity={25} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>🤝 Contribute</Text>
              <Text style={styles.cardText}>Add spots & updates</Text>
            </BlurView>
          </Pressable>

          {/* <Pressable onPress={() => router.push("/admin-review")}>
            <BlurView intensity={25} tint="dark" style={styles.card}>
              <Text style={styles.cardTitle}>🛠️ Admin Review</Text>
              <Text style={styles.cardText}>Review local contributions</Text>
            </BlurView>
          </Pressable> */}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  spacer: {
    flex: 1,
  },
  cardContainer: {
    gap: 14,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "rgba(20, 25, 35, 0.35)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardText: {
    fontSize: 13,
    color: "rgba(230, 242, 255, 0.9)",
    marginTop: 4,
  },
  adminHotspotWrapper: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    height: 220,
    zIndex: 20,
  },
  adminHotspot: {
    flex: 1,
  },
  menuButton: {
    position: "absolute",
    top: 48,
    right: 20,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(20, 25, 35, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "flex-end",
    paddingTop: 96,
    paddingRight: 20,
  },
  menuPanel: {
    width: 190,
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(20, 25, 35, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});