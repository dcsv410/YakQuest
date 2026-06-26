import React from "react";
import MapView, { Marker, Polyline } from "react-native-maps";

import { River, RiverPoint } from "../../../data/types";

type Props = {
  mapRef: React.RefObject<MapView | null>;
  location: {
    latitude: number;
    longitude: number;
  };
  rivers: River[];
  selectedRiver: River | null;
  allPoints: RiverPoint[];
  start: RiverPoint | null;
  end: RiverPoint | null;
  selectMode: "start" | "end";
  navigationArmed: boolean;
  onSelectRiver: (river: River) => void;
  onSelectStart: (point: RiverPoint) => void;
  onSelectEnd: (point: RiverPoint) => void;
  onNavigationPointPress: (point: RiverPoint) => void;
};

export default function RiverMap({
  mapRef,
  location,
  rivers,
  selectedRiver,
  allPoints,
  start,
  end,
  selectMode,
  navigationArmed,
  onSelectRiver,
  onSelectStart,
  onSelectEnd,
  onNavigationPointPress,
}: Props) {
  const isPublic = (p: RiverPoint) =>
    selectedRiver?.accessPoints?.public?.some((x) => x.id === p.id);

  const isPrivate = (p: RiverPoint) =>
    selectedRiver?.accessPoints?.private?.some((x) => x.id === p.id);

  const isPOI = (p: RiverPoint) =>
    selectedRiver?.pois?.some((x) => x.id === p.id);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
      showsUserLocation
    >
      <Marker coordinate={location} pinColor="blue" />

      {rivers.map((river) => {
        const isSelected = selectedRiver?.id === river.id;

        return (
          <React.Fragment key={river.id}>
            <Polyline
              coordinates={river.coordinates}
              strokeColor="rgba(0,0,0,0)"
              strokeWidth={40}
              tappable
              onPress={() => onSelectRiver(river)}
            />

            <Polyline
              coordinates={river.coordinates}
              strokeColor={isSelected ? "#00D4FF" : "#1CA7A6"}
              strokeWidth={isSelected ? 6 : 4}
            />

            {isSelected &&
              allPoints.map((p) => (
                <Marker
                  key={p.id}
                  coordinate={p}
                  pinColor={
                    start?.id === p.id
                      ? "blue"
                      : end?.id === p.id
                      ? "orange"
                      : isPublic(p)
                      ? "green"
                      : isPrivate(p)
                      ? "red"
                      : isPOI(p)
                      ? "purple"
                      : "gray"
                  }
                  onPress={() => {
                    if (navigationArmed) {
                      onNavigationPointPress(p);
                      return;
                    }

                    if (selectMode === "start") {
                      onSelectStart(p);
                    } else {
                      onSelectEnd(p);
                    }
                  }}
                />
              ))}
          </React.Fragment>
        );
      })}
    </MapView>
  );
}