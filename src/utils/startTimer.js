// src/utils/startTimer.js

/** ============================ Constants & Config ============================= */
// why: Centralize tuning knobs for easy experimentation / testing
const CHANNEL_NAME = "pmp-timer-v1";
const HB_INTERVAL_MS = 1000;     // leader heartbeat cadence
const LEADER_TIMEOUT_MS = 3000;  // if no heartbeat, followers may elect
const ELECTION_BACKOFF_MS = 300; // random delay to reduce election collisions
const HIDDEN_THROTTLE_MS = 15000; // reduce CPU/battery when tab is hidden

/** ================================ Tiny Utils ================================= */
function hasBC() {
  return typeof BroadcastChannel !== "undefined";
}
function now() {
  return Date.now();
}
function isHidden() {
  return typeof document !== "undefined" && !!document.hidden;
}

/** ======================= Drift-corrected local scheduler ====================== *
 * Uses setTimeout with alignment to avoid drift; throttles when hidden.
 * Emits only when the visible "second" changes to limit re-renders.
 */
export function createAlignedScheduler(tick, { hiddenMs = HIDDEN_THROTTLE_MS } = {}) {
  let running = false;
  let startTs = 0;
  let timeoutId = null;
  let lastEmittedSec = -1;

  function clear() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function schedule() {
    if (!running) return;

    const t = now();
    const elapsedMs = Math.max(0, t - startTs);
    const elapsedSec = Math.floor(elapsedMs / 1000);

    if (elapsedSec !== lastEmittedSec) {
      lastEmittedSec = elapsedSec;
      tick(elapsedSec, startTs);
    }

    const delay = isHidden()
      ? hiddenMs
      : Math.max(10, 1000 - (elapsedMs % 1000)); // align to next wall-clock second
    timeoutId = setTimeout(schedule, delay);
  }

  return {
    start: (startTimestampMs = now()) => {
      if (running) return; // idempotent
      running = true;
      startTs = startTimestampMs;
      lastEmittedSec = -1;
      schedule();
    },
    stop: () => {
      running = false;
      clear();
    },
    isRunning: () => running,
    getStart: () => startTs,
  };
}

/** ===================== BroadcastChannel distributed timer ===================== *
 * One leader per origin runs the loop and broadcasts:
 * - Heartbeats: liveness signal.
 * - Ticks: elapsed seconds for followers to render.
 * Followers do not schedule; they only render received ticks.
 */
export function createDistributedTimer({ onTick } = {}) {
  let role = "idle"; // "leader" | "follower" | "idle"
  let bc = null;
  let scheduler = createAlignedScheduler(handleLocalTick);
  let hbId = null;
  let lastSeen = 0;   // last time we observed a leader signal
  let started = false;

  function safePost(msg) {
    try { bc && bc.postMessage(msg); } catch {}
  }

  function handleLocalTick(elapsedSec, startTs) {
    if (role === "leader") {
      onTick && onTick(elapsedSec);
      safePost({ type: "tick", sec: elapsedSec, startTs });
    }
    // followers should not reach here (they don't run scheduler)
  }

  function handleMessage(ev) {
    const msg = ev?.data;
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "hb" || msg.type === "leader-announcement" || msg.type === "tick") {
      // why: update liveness timestamp on any leader activity
      lastSeen = (typeof performance !== "undefined" && performance.now) ? performance.now() : now();
    }

    if (msg.type === "tick" && role !== "leader") {
      role = "follower";
      started = true;
      onTick && onTick(msg.sec);
      return;
    }

    if (msg.type === "stop" || msg.type === "reset") {
      if (role !== "leader") {
        started = false;
        onTick && onTick(0); // reset follower UI
      }
    }
  }

  function startHeartbeat() {
    stopHeartbeat();
    hbId = setInterval(() => safePost({ type: "hb", t: now() }), HB_INTERVAL_MS);
  }
  function stopHeartbeat() {
    if (hbId !== null) {
      clearInterval(hbId);
      hbId = null;
    }
  }

  function electLeader(startTsArg) {
    // why: random backoff reduces simultaneous self-promotion
    const backoff = Math.floor(Math.random() * ELECTION_BACKOFF_MS);
    const timer = setTimeout(() => {
      const ts = (typeof performance !== "undefined" && performance.now) ? performance.now() : now();
      const stale = ts - lastSeen > LEADER_TIMEOUT_MS;
      if (stale && role !== "leader") {
        role = "leader";
        safePost({ type: "leader-announcement", t: now() });
        scheduler.start(startTsArg || now());
        startHeartbeat();
      }
    }, backoff);

    // why: abort election if a leader speaks during backoff
    const cancelOnHB = (ev) => {
      const t = ev?.data?.type;
      if (t === "hb" || t === "leader-announcement" || t === "tick") {
        clearTimeout(timer);
        bc && bc.removeEventListener("message", cancelOnHB);
      }
    };
    bc && bc.addEventListener("message", cancelOnHB);
  }

  function ensureBC() {
    if (bc) return true;
    if (!hasBC()) return false;
    bc = new BroadcastChannel(CHANNEL_NAME);
    bc.addEventListener("message", handleMessage);
    lastSeen = -Infinity; // treat as stale until a signal arrives
    return true;
  }

  function start(startTimestampMs) {
    if (started) return;
    started = true;

    if (!ensureBC()) {
      // why: fallback for browsers without BroadcastChannel
      role = "leader";
      scheduler.start(startTimestampMs || now());
      return;
    }

    // If we haven't seen a leader recently, run an election; else follow.
    const ts = (typeof performance !== "undefined" && performance.now) ? performance.now() : now();
    const seenRecently = ts - lastSeen <= LEADER_TIMEOUT_MS;
    if (!seenRecently) electLeader(startTimestampMs);
    else role = "follower";
  }

  function stop({ reset = false } = {}) {
    started = false;
    if (role === "leader") {
      scheduler.stop();
      stopHeartbeat();
      safePost({ type: reset ? "reset" : "stop" });
    }
    role = "idle";
  }

  function destroy() {
    stop();
    if (bc) {
      try { bc.close(); } catch {}
      bc = null;
    }
  }

  function isRunning() {
    return role === "leader" && scheduler.isRunning();
  }

  return { start, stop, destroy, isRunning };
}

/** ============================ React Adapter (UI) ============================== *
 * Singleton binds to a given setElapsedTime; exposes old API for easy migration.
 */
const singleton = (() => {
  let distributed = null;
  let boundSetElapsed = null;

  return {
    get(setElapsedTime) {
      if (!distributed || boundSetElapsed !== setElapsedTime) {
        boundSetElapsed = setElapsedTime;
        distributed = createDistributedTimer({ onTick: (sec) => setElapsedTime(sec) });
      }
      return distributed;
    },
    reset() {
      distributed?.destroy();
      distributed = null;
      boundSetElapsed = null;
    },
  };
})();

/** =============================== Public API ================================== *
 * Matches previous usage: startTimer/stopTimer/resetTimer.
 * Only comments on the "why" to keep code self-explanatory.
 */
function startTimer(setTimerRunning, setElapsedTime, startTimestampMs) {
  const dt = singleton.get(setElapsedTime);
  if (dt.isRunning()) return; // why: avoid duplicate leaders/loops
  setTimerRunning(true);
  dt.start(startTimestampMs);
}

function stopTimer(setTimerRunning, setElapsedTime, { reset = false } = {}) {
  const dt = singleton.get(setElapsedTime);
  dt.stop({ reset });
  setTimerRunning(false);
  if (reset) setElapsedTime(0); // why: reflect reset immediately in UI
}

function resetTimer(setTimerRunning, setElapsedTime) {
  stopTimer(setTimerRunning, setElapsedTime, { reset: true });
}

export default {
  startTimer,
  stopTimer,
  resetTimer,
  // exposed for tests/advanced control
  createDistributedTimer,
  createAlignedScheduler,
};
