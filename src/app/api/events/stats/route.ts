import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_ROWS = 10000;

function isAdmin(req: NextRequest): boolean {
  const secret = req.headers.get("x-edg-secret");
  const adminPw = req.headers.get("x-edg-admin-password");
  const envSecret = process.env.EDG_WEBHOOK_SECRET;
  const envAdminPw = process.env.EDG_ADMIN_PASSWORD ?? "admin1234";
  return (envSecret != null && secret === envSecret) || adminPw === envAdminPw;
}

type LogRow = {
  event_name: string | null;
  session_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string | null;
};

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// Convert UTC ISO string to JST hour (0-23). Falls back to null on bad input.
function jstHour(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t + 9 * 60 * 60 * 1000).getUTCHours();
}

function topEntries(map: Map<string, number>, limit: number): { key: string; count: number }[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function bump(map: Map<string, number>, key: string | null, by = 1) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + by);
}

function emptyStats() {
  return {
    activeSessions: 0,
    totalEvents: 0,
    spotRanking: [] as { spotId: string; count: number }[],
    searchKeywords: [] as { query: string; count: number; zeroResults: number }[],
    noticeViews: [] as { noticeId: string; count: number }[],
    categoryUsage: [] as { category: string; count: number }[],
    hourly: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 })),
    location: { request: 0, grant: 0, deny: 0, grantRate: 0 },
    generatedAt: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("event_logs")
    .select("event_name, session_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (error || !data) {
    // Auth passed but Supabase unavailable — return empty stats rather than failing.
    return NextResponse.json({ stats: emptyStats(), warning: "supabase_unavailable" });
  }

  const rows = data as LogRow[];
  const stats = emptyStats();
  stats.totalEvents = rows.length;

  const sessions = new Set<string>();
  const spots = new Map<string, number>();
  const searchCount = new Map<string, number>();
  const searchZero = new Map<string, number>();
  const notices = new Map<string, number>();
  const categories = new Map<string, number>();

  for (const row of rows) {
    if (row.session_id) sessions.add(row.session_id);

    const hour = jstHour(row.created_at);
    if (hour != null) stats.hourly[hour].count += 1;

    const name = row.event_name ?? "";
    const p = row.payload ?? {};

    switch (name) {
      case "spot_open":
        bump(spots, str(p.spotId));
        break;
      case "search_submit": {
        const q = str(p.query);
        if (q) {
          bump(searchCount, q);
          if (num(p.results) === 0) bump(searchZero, q);
        }
        break;
      }
      case "notice_open":
        bump(notices, str(p.noticeId));
        break;
      case "quick_category":
      case "category_toggle":
        bump(categories, str(p.category));
        break;
      case "location_request":
        stats.location.request += 1;
        break;
      case "location_grant":
        stats.location.grant += 1;
        break;
      case "location_deny":
        stats.location.deny += 1;
        break;
    }
  }

  stats.activeSessions = sessions.size;
  stats.spotRanking = topEntries(spots, 15).map((e) => ({ spotId: e.key, count: e.count }));
  stats.searchKeywords = topEntries(searchCount, 20).map((e) => ({
    query: e.key,
    count: e.count,
    zeroResults: searchZero.get(e.key) ?? 0,
  }));
  stats.noticeViews = topEntries(notices, 15).map((e) => ({ noticeId: e.key, count: e.count }));
  stats.categoryUsage = topEntries(categories, 15).map((e) => ({ category: e.key, count: e.count }));
  stats.location.grantRate =
    stats.location.request > 0
      ? Math.round((stats.location.grant / stats.location.request) * 100)
      : 0;

  return NextResponse.json({ stats });
}
