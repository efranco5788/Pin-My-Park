// src/utils/startTimer.js

let timerRunning = false;
let elapsedTime = 0;
let timerInterval = null;

const startTimer = (setTimerRunning, setElapsedTime) => {
  if (timerRunning) {
    console.warn("Timer is already running!");
    return;
  }
  
  timerRunning = true;
  elapsedTime = 0; // Reset elapsed time

  // Start the timer and update the elapsed time every second
  timerInterval = setInterval(() => {
    elapsedTime += 1;
    setElapsedTime(elapsedTime);
  }, 1000);

  setTimerRunning(true);
};

function stopTimer(setTimerRunning, setElapsedTime) {
  if (!timerRunning) {
    console.warn("No timer is running!");
    return;
  }

  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  setTimerRunning(false);
  setElapsedTime(0); // Keep the last elapsed time
}

const resetTimer = (setTimerRunning, setElapsedTime) => {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
  elapsedTime = 0;
  setTimerRunning(false);
  setElapsedTime(0);
};

export default {
  startTimer,
  stopTimer,
  resetTimer,
};
  