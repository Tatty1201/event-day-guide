import App from "@/components/App";
import supabase from "@/lib/supabase";
import { NOTICES, type Notice } from "@/data/data";

export const revalidate = 60; // 60秒ごとに再取得

async function fetchNotices(): Promise<Notice[]> {
  const published = await supabase
    .from("notices")
    .select("id, cat, title, time, body, pinned, status")
    .eq("status", "published")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (!published.error) {
    if (!published.data?.length) return NOTICES;
    return published.data as Notice[];
  }

  const fallback = await supabase
    .from("notices")
    .select("id, cat, title, time, body, pinned")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (fallback.error) {
    console.error("Failed to fetch notices", fallback.error.message);
    return NOTICES;
  }
  if (!fallback.data?.length) return NOTICES;
  return fallback.data as Notice[];
}

export default async function Page() {
  const notices = await fetchNotices();
  return <App initialNotices={notices} />;
}
