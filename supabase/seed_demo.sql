-- Optional demo seed data for a fresh Event Day Guide Supabase project.

insert into public.events (id, name, short_name, date_label, venue, survey_url, status)
values (
  'fureai-festa-2026',
  'みなと市民ふれあいフェスタ 2026',
  'ふれあいフェスタ',
  '2026年6月6日（土）10:00–16:00',
  'みなと中央公園',
  'https://docs.google.com/forms/',
  'published'
)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  date_label = excluded.date_label,
  venue = excluded.venue,
  survey_url = excluded.survey_url,
  status = excluded.status,
  updated_at = now();

insert into public.categories (id, event_id, label, color, icon, sort_order, is_visible)
values
  ('reception', 'fureai-festa-2026', '受付', '#2f7dd1', 'reception', 10, true),
  ('hq', 'fureai-festa-2026', '本部', '#6b5bd2', 'flag', 20, true),
  ('toilet', 'fureai-festa-2026', 'トイレ', '#2a9d9d', 'toilet', 30, true),
  ('firstaid', 'fureai-festa-2026', '救護', '#d6453f', 'cross', 40, true),
  ('food', 'fureai-festa-2026', '飲食', '#e8743b', 'food', 50, true),
  ('rest', 'fureai-festa-2026', '休憩所', '#6aa84f', 'seat', 60, true),
  ('stage', 'fureai-festa-2026', 'ステージ', '#c0457a', 'stage', 70, true),
  ('booth', 'fureai-festa-2026', '体験ブース', '#d9a022', 'booth', 80, true),
  ('lost', 'fureai-festa-2026', '落とし物', '#7a8087', 'search', 90, true)
on conflict (id) do update set
  label = excluded.label,
  color = excluded.color,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;

insert into public.notices (id, event_id, cat, title, body, time, pinned, status, source)
values
  ('n1', 'fureai-festa-2026', 'important', '南ゲート付近が混雑しています', '現在、正面（南）ゲート付近が大変混み合っています。西ゲートからの入退場もあわせてご利用ください。場内アナウンスでも順次ご案内します。', '13:20', true, 'published', 'seed'),
  ('n2', 'fureai-festa-2026', 'crowd', 'キッチンカー広場が混み合っています', 'お昼のピークで、キッチンカー広場が混雑しています。地元グルメ屋台や東側のお店もあわせてご検討ください。', '12:50', false, 'published', 'seed'),
  ('n3', 'fureai-festa-2026', 'lost', '青い水筒を本部でお預かりしています', 'メインステージ付近で青いステンレス水筒の落とし物がありました。本部テント（落とし物センター）でお預かりしています。', '12:30', false, 'published', 'seed')
on conflict (id) do update set
  event_id = excluded.event_id,
  cat = excluded.cat,
  title = excluded.title,
  body = excluded.body,
  time = excluded.time,
  pinned = excluded.pinned,
  status = excluded.status,
  source = excluded.source,
  updated_at = now();
