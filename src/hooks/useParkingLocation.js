import { useState, useEffect, useCallback } from "react";
import { getAddressFromCoordinates } from "../utils/geocoding";

const PARKING_STORAGE_KEY = "parkingLocation";
const ADDITIONALINFO_STORAGE_KEY = "additionalInfo";

const useParkingLocation = () => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("Not available");
  const [timestamp, setTimestamp] = useState("Not available");
  const [isParkingSaved, setIsParkingSaved] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState({
    floor: "",
    section: "",
  });

  // Load parking location and additional info from localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem(PARKING_STORAGE_KEY);
    const savedInfo = localStorage.getItem(ADDITIONALINFO_STORAGE_KEY);

    if (savedLocation) {
      const parsedLocation = JSON.parse(savedLocation);
      setLocation(parsedLocation.location);
      setTimestamp(parsedLocation.timestamp);
      setIsParkingSaved(true);

      getAddressFromCoordinates(
        parsedLocation.location.latitude,
        parsedLocation.location.longitude
      )
        .then((fetchedAddress) => setAddress(fetchedAddress))
        .catch(() => setAddress("Not available"));
    }

    if (savedInfo) {
      setAdditionalInfo(JSON.parse(savedInfo));
    }
  }, []);

  // Save parking location to localStorage
  const saveParkingLocation = useCallback((newLocation, newTimestamp) => {
    setLocation(newLocation);
    setTimestamp(newTimestamp);
    setIsParkingSaved(true);
    localStorage.setItem(
      PARKING_STORAGE_KEY,
      JSON.stringify({ location: newLocation, timestamp: newTimestamp })
    );

    getAddressFromCoordinates(newLocation.latitude, newLocation.longitude)
      .then((fetchedAddress) => setAddress(fetchedAddress))
      .catch(() => setAddress("Not available"));
  }, []);

  // Save additional parking information
  const saveAdditionalInfo = useCallback(() => {
    localStorage.setItem(ADDITIONALINFO_STORAGE_KEY, JSON.stringify(additionalInfo));
    alert("Additional information saved!");
  }, [additionalInfo]);

  // Clear parking data
  const clearParkingLocation = useCallback(() => {
    setLocation(null);
    setAddress("Not available");
    setTimestamp("Not available");
    setIsParkingSaved(false);
    setAdditionalInfo({ floor: "", section: "" });

    localStorage.removeItem(PARKING_STORAGE_KEY);
    localStorage.removeItem(ADDITIONALINFO_STORAGE_KEY);
  }, []);

  return {
    location,
    address,
    timestamp,
    isParkingSaved,
    additionalInfo,
    setAdditionalInfo,
    saveParkingLocation,
    saveAdditionalInfo,
    clearParkingLocation,
  };
};

export default useParkingLocation;