import { useEffect, useState } from "react";
import * as Location from "expo-location";

export function useUserLocation() {
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);

  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const loadLocation = async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setPermissionDenied(true);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (updated) => {
          setLocation(updated.coords);
        }
      );
    };

    loadLocation();

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    location,
    permissionDenied,
  };
}