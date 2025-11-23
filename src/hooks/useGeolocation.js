import { useState, useCallback, useEffect, useRef } from "react";

const PARKING_STORAGE_KEY = "parkingLocation";

const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  // Track active requests without triggering rerenders
  const isFetchingRef = useRef(false);

  // Load saved location on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(PARKING_STORAGE_KEY);
      if (!savedData) return;

      const parsed = JSON.parse(savedData);
      if (!parsed.location) return;

      setLocation(parsed.location);
      setTimestamp(parsed.timestamp);
    } catch (err) {
      console.warn("Failed to parse stored parking location.");
    }
  }, []);

  // Save location to local storage when it changes
  useEffect(() => {
    if (!location || !timestamp) return;

    try {
      const existing = localStorage.getItem(PARKING_STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};

      if (
        !parsed.location ||
        parsed.location.latitude !== location.latitude ||
        parsed.location.longitude !== location.longitude
      ) {
        localStorage.setItem(
          PARKING_STORAGE_KEY,
          JSON.stringify({ location, timestamp })
        );
      }
    } catch (err) {
      console.warn("Failed to write parking location:", err);
    }
  }, [location, timestamp]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const message = "Geolocation is not supported by this browser.";
      setError(message);
      return Promise.reject(new Error(message));
    }

    // Prevent multiple calls
    if (isFetchingRef.current) {
      return Promise.reject(new Error("Location request already in progress"));
    }

    isFetchingRef.current = true;
    setIsFetching(true);
    setError(null); // Clear old errors

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          const safeAccuracy =
            typeof accuracy === "number" && !Number.isNaN(accuracy)
              ? accuracy
              : null;

          console.log(
            `Location fetched: ${latitude}, ${longitude} Accuracy: ${safeAccuracy}`
          );

          const currentTimestamp = Date.now();

          setLocation({ latitude, longitude, accuracy: safeAccuracy });
          setTimestamp(currentTimestamp);

          resolve({
            latitude,
            longitude,
            accuracy: safeAccuracy,
            timestamp: currentTimestamp,
          });
        },
        (err) => {
          let message = "An unknown error occurred.";

          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = "Permission denied. Please allow location access.";
              break;
            case err.POSITION_UNAVAILABLE:
              message = "Position unavailable.";
              break;
            case err.TIMEOUT:
              message = "Location request timed out.";
              break;
          }

          setError(message);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }).finally(() => {
      isFetchingRef.current = false;
      setIsFetching(false);
    });
  }, []);

  return { location, error, timestamp, getLocation, isFetching };
};

export default useGeolocation;