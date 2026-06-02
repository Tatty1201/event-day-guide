import App from "@/components/App";
import supabase from "@/lib/supabase";
import { NOTICES, type Notice } from "@/data/data";

export const revalidate = 60; // 60秒ごとに再取得

async function fetchNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("notices")
    .select("id, cat, title, time, body, pinned")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data?.length) return NOTICES;
  return data as Notice[];
}

export default async function Page() {
  const notices = await fetchNotices();
  return <App initialNotices={notices} />;
}
