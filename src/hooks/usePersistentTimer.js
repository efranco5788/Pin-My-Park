import { useEffect, useState, useCallback, useRef } from "react";

const TIMER_STORAGE_KEY = "timerState";

export default function usePersistentTimer(isParkingSaved) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [hasRestored, setHasRestored] = useState(false);
  const intervalRef = useRef(null);

  const runInterval = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const startTimer = useCallback(() => {
    if (intervalRef.current) return;

    const startTime = Date.now() - elapsedTime * 1000;
    localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({ startTime, running: true })
    );

    setTimerRunning(true);
    runInterval();
  }, [elapsedTime, runInterval]);

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerRunning(false);

    const startTime = Date.now() - elapsedTime * 1000;
    localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({ startTime, running: false })
    );
  }, [elapsedTime]);

  const resetTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerRunning(false);
    setElapsedTime(0);
    localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({ startTime: Date.now(), running: false })
    );
  }, []);
  
  useEffect(() => {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved && isParkingSaved) {
      const { startTime, running } = JSON.parse(saved);
      if (startTime) {
        const now = Date.now();
        const restoredElapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(restoredElapsed);

        if (running) {
          setTimerRunning(true);
          runInterval();
        }
      }
    }
    setHasRestored(true);
  }, [runInterval, isParkingSaved]);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  return {
    timerRunning,
    elapsedTime,
    startTimer,
    stopTimer,
    resetTimer,
    hasRestored,
  };
}