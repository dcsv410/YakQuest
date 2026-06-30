import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
  AppState,
} from "react-native";
import MapView from "react-native-maps";
import {
  getRiverLength,
  getTripDistance,
  getTripTimeRange,
  getTripTimeline,
  getGoogleMapsUrl,
} from "../src/services/tripService";
import TripPanel from "../src/features/trip-planning/components/TripPanel";
import TripOverview from "../src/features/trip-planning/components/TripOverview";
import SafetyScreen from "../src/features/trip-planning/components/SafetyScreen";
import ShuttleScreen from "../src/features/trip-planning/components/ShuttleScreen";
import RiverMap from "../src/features/trip-planning/components/RiverMap";
import { useUserLocation } from "../src/features/trip-planning/hooks/useUserLocation";
import { useRiverFlow } from "../src/features/trip-planning/hooks/useRiverFlow";
import { useTripNavigation } from "../src/features/trip-planning/hooks/useTripNavigation";
import { getAllRivers } from "../src/services/riverService";
import { River, RiverPoint } from "../src/data/types";
import { getRiverMapPoints } from "../src/services/mapService";
import { useTripPlanner } from "../src/features/trip-planning/hooks/useTripPlanner";
import { useSavedTrips } from "../src/features/trip-planning/hooks/useSavedTrips";
import { useLocalSearchParams } from "expo-router";
import { getSavedTripById } from "../src/services/savedTripService";
import RiverSelectSheet from "../src/features/trip-planning/components/RiverSelectSheet";
import { useRecentRivers } from "../src/features/trip-planning/hooks/useRecentRivers";
import NavigationHud from "../src/features/trip-planning/components/NavigationHud";
import { getPathDistanceFeetBetweenIndexes } from "../src/features/trip-planning/utils/tripMath";
import { findClosestIndex, feetToMiles } from "../src/features/trip-planning/utils/geo";
import TripCompleteScreen from "../src/features/trip-planning/components/TripCompleteScreen";
import { saveCompletedTrip } from "../src/services/completedTripService";
import { getCompletedTripById } from "../src/services/completedTripService";
import { useRouter } from "expo-router";
import { useLocalContributionPoints } from "../src/features/contribute/hooks/useLocalContributionPoints";
import SafetyStartScreen from "../src/features/trip-planning/components/SafetyStartScreen";
import { setupNavigationNotifications } from "../src/services/notificationService";
import { useApprovedRemovalPointIds } from "../src/features/contribute/hooks/useApprovedRemovalPointIds";
import {
  startBackgroundNavigation,
  stopBackgroundNavigation,
  getBackgroundCompletedTrip,
  clearBackgroundCompletedTrip,
} from "../src/services/backgroundNavigationService";
import { FEET_PER_MILE } from "@yakquest/shared";
import {
  FAST_PADDLING_MPH,
  SLOW_PADDLING_MPH,
} from "@yakquest/shared";

export default function PlanTrip() {
  const mapRef = useRef<MapView | null>(null);
  const router = useRouter();

  const [rivers, setRivers] = useState<River[]>([]);
  const [riversLoading, setRiversLoading] = useState(true);
  const [riversError, setRiversError] = useState<string | null>(null);
  useEffect(() => {
    async function loadRivers() {
      try {
        setRiversLoading(true);
        setRiversError(null);

        const loadedRivers = await getAllRivers();
        setRivers(loadedRivers);
      } catch (error) {
        console.error("Failed to load rivers", error);
        setRiversError("Failed to load rivers");
      } finally {
        setRiversLoading(false);
      }
    }

    loadRivers();
  }, []);

  const { location, permissionDenied } = useUserLocation();

  const planner = useTripPlanner();

  const {
    selectedRiver,
    start,
    end,
    selectMode,
    showOverview,
    showSafetyScreen,
    showShuttleScreen,
    tripActive,
    navigationArmed,
    navigationTarget,
  } = planner;

  const { localPoints } = useLocalContributionPoints(selectedRiver?.id);
  const { removedPointIds } = useApprovedRemovalPointIds();

  const visibleLocalPoints = localPoints.filter(
    (point) => !removedPointIds.includes(point.id)
  );

  const {
    approachingPoint,
    distanceToEndFeet,
    nextPoint,
    distanceToNextPointFeet,
    averageSpeedMph,
    estimatedTimeRemainingMs,
    resetNavigationAlerts,
  } = useTripNavigation({
    location,
    selectedRiver,
    end,
    tripActive,
    navigationArmed,
    localPoints: visibleLocalPoints,
    onTripComplete: (summary) => {
      stopBackgroundNavigation();
      planner.completeTrip();

      setTripSummary({
        actualDistanceMiles: summary.actualDistanceFeet / FEET_PER_MILE,
        elapsedMs: summary.elapsedMs,
      });
    },
  });

  const {
    flowCfs,
    flowRating,
    safetyWarnings,
  } = useRiverFlow(selectedRiver);

  const riverLength = getRiverLength(selectedRiver);
  const segmentMiles = getTripDistance(selectedRiver, start, end);
  const time = getTripTimeRange(segmentMiles);
  const timeline = getTripTimeline(selectedRiver, start, end, visibleLocalPoints);

  const [showRiverSelect, setShowRiverSelect] = useState(false);
  const { recentRivers, addRecentRiver } = useRecentRivers();
  const [showSafetyStart, setShowSafetyStart] = useState(false);

  const allPoints = [
    ...getRiverMapPoints(selectedRiver),
    ...localPoints,
  ];

  const goToAddPoint = () => {
    router.push(
      selectedRiver
        ? `/contribute?mode=existing-river-point&riverId=${selectedRiver.id}`
        : "/contribute"
    );
  };

  const openMaps = (p: RiverPoint | null) => {
    if (!p) return;
    Linking.openURL(getGoogleMapsUrl(p));
  };

  const { saveCurrentTrip } = useSavedTrips();
  const handleSaveTrip = async () => {
    if (!selectedRiver || !start || !end) return;

    await saveCurrentTrip(
      selectedRiver,
      start,
      end,
      segmentMiles
    );

    Alert.alert("Trip Saved", "This trip has been saved.");
  };

  const { savedTripId, startTrip } = useLocalSearchParams();

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

  const [tripSummary, setTripSummary] = useState<{
    actualDistanceMiles: number;
    elapsedMs: number;
  } | null>(null);

  const centerMapAbovePanel = (river: River) => {
    if (!mapRef.current || river.coordinates.length === 0) return;

    mapRef.current.fitToCoordinates(river.coordinates, {
      edgePadding: {
        top: 80,
        right: 40,
        bottom: 420,
        left: 40,
      },
      animated: true,
    });
  };

  const handleNavigationPointPress = (point: RiverPoint) => {
    if (!selectedRiver || !location) return;

    const currentIndex = findClosestIndex(
      selectedRiver.coordinates,
      location
    );

    const pointIndex = findClosestIndex(
      selectedRiver.coordinates,
      point
    );

    const distanceFeet = getPathDistanceFeetBetweenIndexes(
      selectedRiver,
      currentIndex,
      pointIndex
    );

    const distanceMiles = feetToMiles(distanceFeet);

    const fastHours = distanceMiles / FAST_PADDLING_MPH;
    const slowHours = distanceMiles / SLOW_PADDLING_MPH;

    const formatTime = (hours: number) => {
      const minutes = Math.round(hours * 60);

      if (minutes < 60) {
        return `${minutes} min`;
      }

      const h = Math.floor(minutes / 60);
      const m = minutes % 60;

      return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
    };
    
    const alertText = [
      getPointTypeLabel(point.type),
      `Distance: ${distanceMiles.toFixed(2)} mi`,
      `Estimated time: ${formatTime(fastHours)} – ${formatTime(slowHours)}`,
    ]
      .filter(Boolean)
      .join("\n");

    Alert.alert(
      point.name,
      point.description
        ? `${alertText}\n\n${point.description}`
        : alertText,
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

  const { completedTripId } = useLocalSearchParams<{
    completedTripId?: string;
  }>();

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

  const startNavigationView = () => {
    if (!location) return;

    mapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      1000
    );
  };

  // useEffect(() => {
  //   async function testApi() {
  //     try {
  //       const rivers = await fetchRivers();
  //       console.log("BACKEND RIVERS:", rivers);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   }

  //   testApi();
  // }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      if (!navigationArmed) return;

      recenterOnUser();
    });

    return () => sub.remove();
  }, [navigationArmed, location]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;

      const completed = await getBackgroundCompletedTrip();
      if (!completed) return;

      await clearBackgroundCompletedTrip();
      await stopBackgroundNavigation();

      const startedAt = completed.startedAt
        ? new Date(completed.startedAt).getTime()
        : Date.now();

      const completedAt = completed.completedAt
        ? new Date(completed.completedAt).getTime()
        : Date.now();

      setTripSummary({
        actualDistanceMiles: segmentMiles,
        elapsedMs: Math.max(0, completedAt - startedAt),
      });

      planner.completeTrip();
    });

    return () => subscription.remove();
  }, [segmentMiles]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;

      const completed = await getBackgroundCompletedTrip();

      if (!completed) return;

      await clearBackgroundCompletedTrip();

      Alert.alert(
        "Trip Complete",
        "Your trip was completed while the screen was locked.",
        [
          {
            text: "Show Summary",
            onPress: () => {
              planner.completeTrip();

              setTripSummary({
                actualDistanceMiles: segmentMiles,
                elapsedMs: 0,
              });
            },
          },
        ]
      );
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const loadTrip = async () => {
      if (!savedTripId || Array.isArray(savedTripId)) return;

      const savedTrip = await getSavedTripById(savedTripId);
      if (!savedTrip) return;

      const river =
        rivers.find(
          (item) =>
            item.id === savedTrip.riverId ||
            item.name === savedTrip.riverName
        );

      if (!river) {
        console.warn(
          "Saved trip river not found:",
          savedTrip.riverId,
          savedTrip.riverName
        );
        return;
      }

      planner.loadSavedTrip(
        river,
        savedTrip.start,
        savedTrip.end
      );

      resetNavigationAlerts();
      centerMapAbovePanel(river);

      if (startTrip === "true") {
        planner.beginStartTripFlow();
      }
    };

    loadTrip();
  }, [savedTripId, startTrip, rivers]);

  useEffect(() => {
    const loadCompletedTrip = async () => {
      if (!completedTripId) return;

      const trip = await getCompletedTripById(
        completedTripId
      );

      if (!trip) return;

      const river = rivers.find(
        (r) => r.id === trip.riverId
      );

      if (!river) return;

      planner.selectRiver(river);

      setTimeout(() => {
        planner.selectStart(trip.start);
        planner.selectEnd(trip.end);

        centerMapAbovePanel(river);

        planner.showTripOverview();
      }, 300);
    };

    loadCompletedTrip();
  }, [completedTripId, rivers]);

  useEffect(() => {
    if (!navigationArmed || !selectedRiver || !end) return;

    startNavigationView();

    setupNavigationNotifications();

    startBackgroundNavigation({
      riverId: selectedRiver.id,
      end,
      localPoints: visibleLocalPoints,
    });
  }, [navigationArmed]);

  if (permissionDenied) {
    return (
      <View style={styles.loading}>
        <Text>Location permission is required to plan a trip.</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text>Loading GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RiverMap
        mapRef={mapRef}
        location={location}
        rivers={rivers}
        selectedRiver={selectedRiver}
        allPoints={allPoints}
        start={start}
        end={end}
        selectMode={selectMode}
        navigationArmed={navigationArmed}
        onSelectRiver={(river) => {
          planner.selectRiver(river);
          resetNavigationAlerts();
          addRecentRiver(river);
          centerMapAbovePanel(river);
        }}
        onSelectStart={planner.selectStart}
        onSelectEnd={planner.selectEnd}
        onNavigationPointPress={handleNavigationPointPress}
      />

      <NavigationHud
        navigationArmed={navigationArmed}
        distanceToEndFeet={distanceToEndFeet}
        nextPoint={nextPoint}
        distanceToNextPointFeet={distanceToNextPointFeet}
        averageSpeedMph={averageSpeedMph}
        estimatedTimeRemainingMs={estimatedTimeRemainingMs}
      />

      {selectedRiver && (
        <TouchableOpacity
          style={styles.addPointButton}
          onPress={goToAddPoint}
        >
          <Text style={styles.addPointText}>＋ Add Point</Text>
        </TouchableOpacity>
      )}

      {navigationArmed && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={recenterOnUser}
        >
          <Text style={styles.recenterText}>
            📍 Recenter Map
          </Text>
        </TouchableOpacity>
      )}

      {!navigationArmed &&
        !showOverview &&
        !showSafetyScreen &&
        !showShuttleScreen &&
        !showRiverSelect && (
          <TripPanel
            selectedRiver={selectedRiver}
            tripActive={tripActive}
            navigationArmed={navigationArmed}
            navigationTarget={navigationTarget}
            approachingPoint={approachingPoint}
            flowCfs={flowCfs}
            flowRating={flowRating}
            riverLength={riverLength}
            segmentMiles={segmentMiles}
            selectMode={selectMode}
            start={start}
            end={end}
            time={time}
            onShowOverview={planner.showTripOverview}
            onOpenRiverList={() => setShowRiverSelect(true)}
          />
        )}

      <RiverSelectSheet
        visible={showRiverSelect}
        rivers={rivers}
        recentRivers={recentRivers}
        onClose={() => setShowRiverSelect(false)}
        onSelectRiver={(river) => {
          planner.selectRiver(river);
          resetNavigationAlerts();
          addRecentRiver(river);

          centerMapAbovePanel(river);
        }}
      />

      {showOverview && selectedRiver && start && end && (
        <TripOverview
          selectedRiver={selectedRiver}
          start={start}
          end={end}
          flowCfs={flowCfs}
          flowRating={flowRating}
          segmentMiles={segmentMiles}
          time={time}
          timeline={timeline}
          onOpenMaps={openMaps}
          onResetTrip={() => {
            planner.resetTrip();
            resetNavigationAlerts();
          }}
          onStartTrip={planner.beginStartTripFlow}
          onSaveTrip={handleSaveTrip}
        />
      )}

      {showSafetyScreen && (
        <SafetyScreen
          safetyWarnings={safetyWarnings}
          onContinue={planner.continueFromSafety}
        />
      )}

      {showShuttleScreen && (
        <ShuttleScreen
          start={start}
          end={end}
          onNavigateToStart={(point) => {
            planner.navigateToStart();
            openMaps(point);
          }}
          onNavigateToEnd={(point) => {
            planner.navigateToEnd();
            openMaps(point);
          }}
          onAlreadyAtLaunch={planner.alreadyAtLaunch}
        />
      )}

      {tripActive &&
        !navigationArmed &&
        !showOverview &&
        !showSafetyScreen &&
        !showShuttleScreen &&
        !showRiverSelect && (
          <TouchableOpacity
            style={styles.beginPaddlingButton}
            onPress={() => setShowSafetyStart(true)}
          >
            <Text style={styles.buttonText}>Begin Paddling</Text>
          </TouchableOpacity>
        )}

      <SafetyStartScreen
        visible={showSafetyStart}
        flowLevel={flowRating}
        onStart={() => {
          setShowSafetyStart(false);
          planner.beginPaddling();
        }}
      />

      {tripSummary && selectedRiver && start && end && (
        <TripCompleteScreen
          riverName={selectedRiver.name}
          plannedDistanceMiles={segmentMiles}
          actualDistanceMiles={tripSummary.actualDistanceMiles}
          elapsedMs={tripSummary.elapsedMs}
          onSave={async (notes) => {
            await saveCompletedTrip({
              riverId: selectedRiver.id,
              riverName: selectedRiver.name,
              state: selectedRiver.state,
              start,
              end,
              plannedDistanceMiles: segmentMiles,
              actualDistanceMiles: tripSummary.actualDistanceMiles,
              elapsedMs: tripSummary.elapsedMs,
              notes,
            });

            Alert.alert("Trip Saved", "Your completed trip log was saved.");
          }}
          onNavigateBackToStart={() => openMaps(start)}
          onDone={() => {
            stopBackgroundNavigation();
            setTripSummary(null);
            planner.resetTrip();
            resetNavigationAlerts();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  beginPaddlingButton: {
    position: "absolute",
    bottom: 35,
    left: 16,
    right: 16,
    backgroundColor: "#1CA7A6",
    padding: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
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