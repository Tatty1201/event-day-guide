import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";

const CAT_PREFIXES: [string, string][] = [
  ["[重要]", "important"],
  ["[混雑]", "crowd"],
  ["[落とし物]", "lost"],
  ["[告知]", "notice"],
  ["[変更]", "change"],
];

function parseSubject(subject: string): { cat: string; title: string } {
  for (const [prefix, cat] of CAT_PREFIXES) {
    if (subject.startsWith(prefix)) {
      return { cat, title: subject.slice(prefix.length).trim() };
    }
  }
  return { cat: "other", title: subject.trim() };
}

export async function POST(req: NextRequest) {
  // 簡易認証：Zapier から送られるシークレットを確認
  const secret = req.headers.get("x-edg-secret");
  if (secret !== process.env.EDG_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const rawSubject: string = body.subject ?? "";
  const rawBody: string = body.body ?? "";

  if (!rawSubject) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }

  const { cat, title } = parseSubject(rawSubject);
  const now = new Date();
  const time = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");

  const { error } = await supabase.from("notices").insert({
    id: `email-${Date.now()}`,
    cat,
    title,
    body: rawBody,
    time,
    pinned: cat === "important",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cat, title });
}
