import { useState, useCallback, useEffect } from "react";

const PARKING_STORAGE_KEY = "parkingLocation";

const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  // Load saved location from localStorage when the hook initializes
  useEffect(() => {
    const savedLocation = localStorage.getItem(PARKING_STORAGE_KEY);
    if (savedLocation) {
      const { location, timestamp } = JSON.parse(savedLocation);
      setLocation(location);
      setTimestamp(timestamp);
    }
  }, []);

  // Store location in localStorage only when it changes
  useEffect(() => {
    const savedData = localStorage.getItem(PARKING_STORAGE_KEY);
    const parsedData = savedData ? JSON.parse(savedData) : null;
  
    if (
      location &&
      timestamp &&
      (!parsedData || parsedData.location.latitude !== location.latitude || parsedData.location.longitude !== location.longitude)
    ) {
      localStorage.setItem(PARKING_STORAGE_KEY, JSON.stringify({ location, timestamp }));
    }
  }, [location, timestamp]);  

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return Promise.reject(new Error("Geolocation not supported"));
    }

    if (isFetching) return Promise.reject(new Error("Location request already in progress"));

    setIsFetching(true);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const currentTimestamp = new Date().toLocaleString();

          console.log(`Location fetched: ${latitude}, ${longitude} with accuracy: ${accuracy}m`);

          /*
          if (accuracy < 25) {
            setError(`Low accuracy (${accuracy.toFixed(2)}m). Enable precise location.`);
            setIsFetching(false);

            return reject(new Error("Low accuracy"));
          }
          */
          setLocation({ latitude, longitude });
          setTimestamp(currentTimestamp);
          setError(null); // Clear any previous errors
          //setIsFetching(false);

          resolve({ latitude, longitude, timestamp: currentTimestamp });
        },
        (err) => {
          let errorMessage = "An unknown error occurred.";
          if (err.code === err.PERMISSION_DENIED) errorMessage = "Permission denied. Please allow location access.";
          if (err.code === err.POSITION_UNAVAILABLE) errorMessage = "Position unavailable.";
          if (err.code === err.TIMEOUT) errorMessage = "Location request timed out.";

          console.error(`Geolocation error: ${errorMessage}`);
          setError(errorMessage);
          //setIsFetching(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }).finally(() => setIsFetching(false));
  }, [isFetching]);

  return { location, error, timestamp, getLocation, isFetching };
};

export default useGeolocation;
