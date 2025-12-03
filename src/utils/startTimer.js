// src/utils/startTimer.js
// Single-instance, drift-corrected timer across tabs via BroadcastChannel.
// Leader tab runs the loop; followers render ticks only.

const CHANNEL_NAME = "pmp-timer-v1";
const HB_INTERVAL_MS = 1000;     // heartbeat period
const LEADER_TIMEOUT_MS = 3000;  // promote if no heartbeat
const ELECTION_BACKOFF_MS = 300; // random 0..N to reduce collisions
const HIDDEN_THROTTLE_MS = 15000;

function hasBC() {
  return typeof BroadcastChannel !== "undefined";
}
function now() {
  return Date.now();
}
function isHidden() {
  return typeof document !== "undefined" && !!document.hidden;
}

/** Drift-corrected scheduler using setTimeout (not setInterval) */
function createAlignedScheduler(tick, { hiddenMs = HIDDEN_THROTTLE_MS } = {}) {
  let running = false;
  let startTs = 0;
  let timeoutId = null;
  let lastEmittedSec = -1;

  function clear() {
    if (timeoutId) {
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
      : Math.max(10, 1000 - (elapsedMs % 1000));
    timeoutId = setTimeout(schedule, delay);
  }

  return {
    start: (startTimestampMs = now()) => {
      if (running) return;
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

/** Broadcast-enabled timer orchestrator */
function createDistributedTimer({ onTick } = {}) {
  let role = "idle"; // 'leader' | 'follower' | 'idle'
  let bc = null;
  let scheduler = createAlignedScheduler(handleLocalTick);
  let hbId = null;
  let lastSeen = 0;
  let started = false;

  function safePost(msg) {
    try {
      bc && bc.postMessage(msg);
    } catch {}
  }

  function handleLocalTick(elapsedSec, startTs) {
    // Leader: emit and broadcast
    if (role === "leader") {
      onTick && onTick(elapsedSec);
      safePost({ type: "tick", sec: elapsedSec, startTs });
    } else {
      // Follower shouldn't be scheduling local ticks
    }
  }

  function handleMessage(ev) {
    const msg = ev?.data;
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "hb") {
      lastSeen = performance.now ? performance.now() : now();
      return;
    }

    if (msg.type === "tick") {
      lastSeen = performance.now ? performance.now() : now();
      // Followers render ticks
      if (role !== "leader") {
        role = "follower";
        started = true;
        onTick && onTick(msg.sec);
      }
      return;
    }

    if (msg.type === "leader-announcement") {
      lastSeen = performance.now ? performance.now() : now();
      if (role !== "leader") role = "follower";
      return;
    }

    if (msg.type === "stop") {
      if (role !== "leader") {
        started = false;
        onTick && onTick(0);
      }
      return;
    }

    if (msg.type === "reset") {
      if (role !== "leader") {
        started = false;
        onTick && onTick(0);
      }
      return;
    }
  }

  function startHeartbeat() {
    stopHeartbeat();
    hbId = setInterval(() => {
      safePost({ type: "hb", t: now() });
    }, HB_INTERVAL_MS);
  }
  function stopHeartbeat() {
    if (hbId) {
      clearInterval(hbId);
      hbId = null;
    }
  }

  function electLeader(startTsArg) {
    // Simple randomized election; cancel if a leader heartbeat arrives.
    const backoff = Math.floor(Math.random() * ELECTION_BACKOFF_MS);
    const startPerf = performance.now ? performance.now() : now();
    const timer = setTimeout(() => {
      const ts = performance.now ? performance.now() : now();
      const stale = ts - lastSeen > LEADER_TIMEOUT_MS;
      if (stale && role !== "leader") {
        // Become leader
        role = "leader";
        safePost({ type: "leader-announcement", t: now() });
        scheduler.start(startTsArg || now());
        startHeartbeat();
      }
    }, backoff);

    // If heartbeat arrives during backoff, abandon election
    const cancelOnHB = (ev) => {
      if (ev?.data?.type === "hb" || ev?.data?.type === "leader-announcement" || ev?.data?.type === "tick") {
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
    // mark leader presence time as "long ago" initially
    lastSeen = -Infinity;
    return true;
  }

  function start(startTimestampMs) {
    if (started) return;
    started = true;

    if (!ensureBC()) {
      // Fallback: no BroadcastChannel → local only
      role = "leader";
      scheduler.start(startTimestampMs || now());
      return;
    }

    // Probe for a leader; if none, elect
    const seenRecently = (performance.now ? performance.now() : now()) - lastSeen <= LEADER_TIMEOUT_MS;
    if (!seenRecently) {
      electLeader(startTimestampMs);
    } else {
      role = "follower";
    }
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

/** Public API: React-friendly adapters (matches previous usage) */
const singleton = (() => {
  let distributed = null;
  let boundSetElapsed = null;

  return {
    get(setElapsedTime) {
      if (!distributed || boundSetElapsed !== setElapsedTime) {
        boundSetElapsed = setElapsedTime;
        distributed = createDistributedTimer({
          onTick: (sec) => setElapsedTime(sec),
        });
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

function startTimer(setTimerRunning, setElapsedTime, startTimestampMs) {
  const dt = singleton.get(setElapsedTime);
  if (dt.isRunning()) return; // avoid duplicate leaders
  setTimerRunning(true);
  dt.start(startTimestampMs);
}

function stopTimer(setTimerRunning, setElapsedTime, { reset = false } = {}) {
  const dt = singleton.get(setElapsedTime);
  dt.stop({ reset });
  setTimerRunning(false);
  if (reset) setElapsedTime(0);
}

function resetTimer(setTimerRunning, setElapsedTime) {
  stopTimer(setTimerRunning, setElapsedTime, { reset: true });
}

export default {
  startTimer,
  stopTimer,
  resetTimer,
  // exposed for testing/advanced hooks
  createDistributedTimer,
  createAlignedScheduler,
};
