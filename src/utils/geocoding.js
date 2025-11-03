// src/utils/geocoding.js


export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === "OK") {
      return data.results[0].formatted_address;
    } else {
      return "Address not found.";
    }
  } catch (error) {
    return "Error fetching address.";
  }
};
