import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_STATUSES = new Set(["draft", "published", "hidden", "deleted"]);
const ALLOWED_CATS = new Set(["important", "crowd", "lost", "notice", "change", "other"]);

function isAdmin(req: NextRequest): boolean {
  const secret = req.headers.get("x-edg-secret");
  const adminPw = req.headers.get("x-edg-admin-password");
  const envSecret = process.env.EDG_WEBHOOK_SECRET;
  const envAdminPw = process.env.EDG_ADMIN_PASSWORD ?? "admin1234";
  return (envSecret != null && secret === envSecret) || adminPw === envAdminPw;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("notices")
    .select("id, cat, title, time, body, pinned, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!error) {
    return NextResponse.json({ notices: data ?? [] });
  }

  // Fallback for legacy schema without status/created_at columns
  const fallback = await supabaseAdmin
    .from("notices")
    .select("id, cat, title, time, body, pinned")
    .limit(100);

  if (fallback.error) {
    // Auth passed but Supabase unavailable — return empty list rather than failing login
    return NextResponse.json({ notices: [], warning: "supabase_unavailable" });
  }

  return NextResponse.json({
    notices: (fallback.data ?? []).map((n) => ({ ...n, status: "published" })),
  });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const cat = typeof payload.cat === "string" && ALLOWED_CATS.has(payload.cat) ? payload.cat : "other";
  const title = typeof payload.title === "string" ? payload.title.trim().slice(0, 80) : "";
  const noticeBody = typeof payload.body === "string" ? payload.body.trim().slice(0, 2000) : "";
  const pinned = cat === "important";

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  const id = `admin-${Date.now()}`;

  const enriched = await supabaseAdmin.from("notices").insert({
    id,
    cat,
    title,
    body: noticeBody,
    time,
    pinned,
    status: "published",
    source: "admin",
    created_at: now.toISOString(),
  });

  if (enriched.error) {
    // Fallback for legacy schema
    const legacy = await supabaseAdmin.from("notices").insert({ id, cat, title, body: noticeBody, time, pinned });
    if (legacy.error) {
      return NextResponse.json({ error: legacy.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, id, cat, title });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const id = typeof payload.id === "string" ? payload.id.trim() : "";
  const status = typeof payload.status === "string" ? payload.status.trim() : "";

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "status must be draft, published, hidden, or deleted" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("notices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    // Retry without updated_at for legacy schema
    const retry = await supabaseAdmin.from("notices").update({ status }).eq("id", id);
    if (retry.error) {
      return NextResponse.json({ error: retry.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, id, status });
}
