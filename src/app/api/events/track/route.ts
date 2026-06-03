import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_EVENT_NAME = 80;
const MAX_SESSION_ID = 120;

function cleanString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function cleanPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([, v]) => {
      return ["string", "number", "boolean"].includes(typeof v) || v === null;
    })
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const eventName = cleanString(payload.eventName, MAX_EVENT_NAME);
  const sessionId = cleanString(payload.sessionId, MAX_SESSION_ID);

  if (!eventName || !sessionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const sequence = typeof payload.sequence === "number" ? Math.max(0, Math.floor(payload.sequence)) : null;
  const previousEvent = cleanString(payload.previousEvent, MAX_EVENT_NAME) || null;
  const path = cleanString(payload.path, 120) || "/";

  const { error } = await supabaseAdmin.from("event_logs").insert({
    event_name: eventName,
    session_id: sessionId,
    sequence,
    previous_event: previousEvent,
    path,
    payload: cleanPayload(payload.payload),
    user_agent: req.headers.get("user-agent")?.slice(0, 240) ?? null,
  });

  // Silently ignore — table may not exist yet in this environment

  return NextResponse.json({ ok: true });
}
