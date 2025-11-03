import React, { useEffect } from "react";

function TimerDurationSection({ timerRunning, elapsedTime, setElapsedTime }) {
  // Start the timer when `timerRunning` is set to true
  useEffect(() => {
    let interval;

    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000); // Increment the timer every second
    }

    // Cleanup the interval when the component unmounts or `timerRunning` becomes false
    return () => clearInterval(interval);
  }, [timerRunning, setElapsedTime]);

  // Helper function to format time as HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  };

  // Inline keyframes using object for animation
  const keyframes = `
    @keyframes flash {
      from {
        opacity: 1;
      }
      to {
        opacity: 0.5;
      }
    }
  `;

  return (
    <div style={{ textAlign: "center", margin: "auto", color: "white" }}>
      {/* Inject inline styles */}
      <style>
        {keyframes}
      </style>
      <h2 style={{
          animation: timerRunning ? "flash 1s infinite alternate" : "none",
        }}
        >
          Elapsed Parking Time: </h2>
      <h2
        style={{
          animation: timerRunning ? "flash 1s infinite alternate" : "none",
        }}
      >
        {formatTime(elapsedTime)}
      </h2>
    </div>
  );
}

export default TimerDurationSection;
