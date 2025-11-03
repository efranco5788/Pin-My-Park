// src/utils/clearParkingInfo.js

import timer from "./startTimer";

const PARKING_STORAGE_KEY = "parkingLocation";

const clearParkingInfo = (setLocation, setAddress, setTimestamp, setTimerRunning, setElapsedTime) => {
    //setLocation(null);
    setAddress("Not Parked");
    setTimestamp("Not available");
    //setTimerRunning(false); // Stop the timer
    timer.resetTimer(setTimerRunning, setElapsedTime); // Reset the timer
    setElapsedTime(0); // Reset elapsed time to 0
  
    localStorage.removeItem(PARKING_STORAGE_KEY); // Clear parking location
    localStorage.removeItem("timerState"); // Clear timer state
  };
  
  export default clearParkingInfo;
  