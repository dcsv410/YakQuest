import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  AppState,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { getAllRivers } from "../src/services/riverService";
import { useUserLocation } from "../src/features/trip-planning/hooks/useUserLocation";
import LiveNavigationHud from "../src/features/trip-planning/components/LiveNavigationHud";
import {
  getNearestRiver,
  getNextPointDownstream,
  getAllRiverPoints,
  getDistanceToRiverPointByPath,
  getAverageSpeedMph ,
} from "../src/features/trip-planning/utils/tripMath";
import { distanceFeet } from "../src/features/trip-planning/utils/geo";
import { River, RiverPoint } from "../src/data/types";
import { useRouter } from "expo-router";
import { useLocalContributionPoints } from "../src/features/contribute/hooks/useLocalContributionPoints";
import {
  startBackgroundLiveNavigation,
  stopBackgroundLiveNavigation,
  stopBackgroundNavigation,
} from "../src/services/backgroundNavigationService";
import { setupNavigationNotifications } from "../src/services/notificationService";
import { useApprovedRemovalPointIds } from "../src/features/contribute/hooks/useApprovedRemovalPointIds";
import SafetyStartScreen from "../src/features/trip-planning/components/SafetyStartScreen";
import { FEET_PER_MILE } from "@yakquest/shared";

const POINT_ALERT_DISTANCE_FEET = 100;

const getPointPinColor = (point: RiverPoint) => {
  switch (point.type) {
    case "public_access":
      return "green";
    case "private_access":
      return "red";
    case "poi":
      return "purple";
    default:
      return "gray";
  }
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

const formatDistance = (feet: number) => {
  if (feet < 528) return `${Math.round(feet)} ft`;
  return `${(feet / FEET_PER_MILE).toFixed(2)} mi`;
};

export default function NavigateScreen() {
  const mapRef = useRef<MapView | null>(null);
  const router = useRouter();

  const { location, permissionDenied } = useUserLocation();

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

  const [selectedRiver, setSelectedRiver] = useState<River | null>(null);
  const { localPoints } = useLocalContributionPoints(selectedRiver?.id);
  const { removedPointIds } = useApprovedRemovalPointIds();

  const visibleLocalPoints = localPoints.filter(
    (point) => !removedPointIds.includes(point.id)
  );
  const liveStartTimeRef = useRef<number | null>(null);
  const liveStartLocationRef = useRef(location);

  const [averageSpeedMph, setAverageSpeedMph] = useState(0);
  const totalLiveDistanceFeetRef = useRef(0);
  const lastLiveLocationRef = useRef(location);
  const [distanceFromRiverFeet, setDistanceFromRiverFeet] =
    useState<number | null>(null);

  const [nextPoint, setNextPoint] =
    useState<RiverPoint | null>(null);

  const [distanceToNextPointFeet, setDistanceToNextPointFeet] =
    useState<number | null>(null);

  const alertedPointIdsRef = useRef(new Set<string>());
  const [showSafetyStart, setShowSafetyStart] = useState(true);
  const [liveNavigationEnabled, setLiveNavigationEnabled] = useState(false);

  const riverPoints = selectedRiver
    ? [...getAllRiverPoints(selectedRiver), ...visibleLocalPoints].filter(
        (point) => !removedPointIds.includes(point.id)
      )
    : [];

  const goToAddPoint = () => {
    router.push(
      selectedRiver
        ? `/contribute?mode=existing-river-point&riverId=${selectedRiver.id}`
        : "/contribute"
    );
  };

  const handlePointPress = (point: RiverPoint) => {
    if (!selectedRiver || !location) return;

    const pointDistance = getDistanceToRiverPointByPath(
      selectedRiver,
      location,
      point
    );  

    Alert.alert(
      point.name,
      [
        getPointTypeLabel(point.type),
        pointDistance != null
          ? `Distance: ${formatDistance(pointDistance)}`
          : "This point appears to be behind you.",
        point.description ? `\n${point.description}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      [
        { text: "Close", style: "cancel" },
        {
          text: "Suggest Removal",
          style: "destructive",
          onPress: () =>
            router.push(
              `/contribute?mode=remove-existing-point&riverId=${selectedRiver.id}&pointId=${point.id}&pointName=${encodeURIComponent(point.name)}`
            ),
        },
      ]
    );
  };

  const recenterOnUser = () => {
    if (!location) return;

    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      700
    );
  };

  useEffect(() => {
    if (!liveNavigationEnabled || !selectedRiver) return;

    let cancelled = false;

    const startLiveBackground = async () => {
      try {
        await setupNavigationNotifications();

        if (cancelled) return;

        // await stopBackgroundNavigation();
        await stopBackgroundLiveNavigation();

        if (cancelled) return;

        const started = await startBackgroundLiveNavigation({
          riverId: selectedRiver.id,
          localPoints: visibleLocalPoints ?? [],
        });

        if (!started) {
          console.log("Live background navigation did not start.");
        }
      } catch (error) {
        console.log("Live background navigation start failed:", error);
      }
    };

    startLiveBackground();

    return () => {
      cancelled = true;
      stopBackgroundLiveNavigation();
    };
  }, [liveNavigationEnabled, selectedRiver?.id, localPoints]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;

      recenterOnUser();
    });

    return () => sub.remove();
  }, [location]);

  useEffect(() => {
    if (!location) return;

    if (!liveStartTimeRef.current) {
      liveStartTimeRef.current = Date.now();
      lastLiveLocationRef.current = location;
      return;
    }

    if (lastLiveLocationRef.current) {
      const segmentFeet = distanceFeet(
        lastLiveLocationRef.current,
        location
      );

      // Ignore GPS jumps
      if (segmentFeet < 300) {
        totalLiveDistanceFeetRef.current += segmentFeet;
      }
    }

    lastLiveLocationRef.current = location;

    const elapsedMs = Date.now() - liveStartTimeRef.current;

    setAverageSpeedMph(
      getAverageSpeedMph(
        totalLiveDistanceFeetRef.current,
        elapsedMs
      )
    );
  }, [location]);

  useEffect(() => {
    if (!location) return;

    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      700
    );
  }, [location]);

  useEffect(() => {
    if (!location) return;

    const nearest = getNearestRiver(rivers, location, 1500);

    if (!nearest) {
      setSelectedRiver(null);
      setDistanceFromRiverFeet(null);
      setNextPoint(null);
      setDistanceToNextPointFeet(null);
      return;
    }

    setSelectedRiver(nearest.river);
    setDistanceFromRiverFeet(nearest.distanceFeet);

    const next = getNextPointDownstream(
      nearest.river,
      location,
      visibleLocalPoints
    );

    setNextPoint(next?.point ?? null);
    setDistanceToNextPointFeet(next?.distanceFeet ?? null);
  }, [location, rivers]);

  useEffect(() => {
    if (!location || !nextPoint) return;
    if (!liveNavigationEnabled) return;

    const proximityFeet = distanceFeet(location, nextPoint);

    if (
      proximityFeet < POINT_ALERT_DISTANCE_FEET &&
      !alertedPointIdsRef.current.has(nextPoint.id)
    ) {
      alertedPointIdsRef.current.add(nextPoint.id);

      Alert.alert(
        nextPoint.name,
        [
          nextPoint.description || "You are approaching this point.",
        ].join("\n")
      );
    }
  }, [location, nextPoint]);

  if (permissionDenied) {
    return (
      <View style={styles.center}>
        <Text>Location permission is required for live navigation.</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Loading GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
      >
        <Marker coordinate={location} pinColor="blue" />

        {selectedRiver && (
          <>
            <Polyline
              coordinates={selectedRiver.coordinates}
              strokeColor="#00D4FF"
              strokeWidth={6}
            />

            {riverPoints.map((point) => (
              <Marker
                key={point.id}
                coordinate={point}
                pinColor={
                  nextPoint?.id === point.id
                    ? "orange"
                    : getPointPinColor(point)
                }
                onPress={() => handlePointPress(point)}
              />
            ))}
          </>
        )}
      </MapView>

      {liveNavigationEnabled && (
        <LiveNavigationHud
          river={selectedRiver}
          distanceFromRiverFeet={distanceFromRiverFeet}
          nextPoint={nextPoint}
          distanceToNextPointFeet={distanceToNextPointFeet}
          averageSpeedMph={averageSpeedMph}
        />
      )}

      <TouchableOpacity
        style={styles.addPointButton}
        onPress={goToAddPoint}
      >
        <Text style={styles.addPointText}>＋ Add Point</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.recenterButton}
        onPress={recenterOnUser}
      >
        <Text style={styles.recenterText}>📍 Recenter Map</Text>
      </TouchableOpacity>

      <SafetyStartScreen
        visible={showSafetyStart}
        flowLevel={null}
        onStart={() => {
          setShowSafetyStart(false);
          setLiveNavigationEnabled(true);
          recenterOnUser();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recenterButton: {
    position: "absolute",
    right: 16,
    bottom: 40,
    minWidth: 140,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(20, 25, 35, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
  },
  recenterText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  addPointButton: {
    position: "absolute",
    left: 16,
    bottom: 40,
    minWidth: 130,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(20, 25, 35, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
  },
  addPointText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});