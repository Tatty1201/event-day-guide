"use client";

type TrackPayload = Record<string, string | number | boolean | null | undefined>;

const SESSION_KEY = "edg_session_id";
let sequence = 0;
let previousEvent: string | null = null;

function getSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return "session-unavailable";
  }
}

export function track(eventName: string, payload: TrackPayload = {}) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    eventName,
    sessionId: getSessionId(),
    sequence: ++sequence,
    previousEvent,
    path: window.location.pathname,
    payload,
  });

  previousEvent = eventName;

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/events/track", blob);
    return;
  }

  fetch("/api/events/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
