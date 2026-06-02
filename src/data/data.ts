export type Category = {
  id: string;
  label: string;
  color: string;
  icon: string;
};

export type Spot = {
  id: string;
  name: string;
  cat: string;
  x: number;
  y: number;
  place: string;
  desc: string;
  note?: string;
  keywords: string[];
};

export type Notice = {
  id: string;
  cat: string;
  title: string;
  time: string;
  body: string;
  pinned?: boolean;
};

export type NoticeCat = { label: string; color: string };

export type EventInfo = {
  name: string;
  short: string;
  date: string;
  venue: string;
  surveyUrl: string;
};

export const CATEGORIES: Category[] = [
  { id: "reception", label: "受付",     color: "#2f7dd1", icon: "reception" },
  { id: "hq",        label: "本部",     color: "#6b5bd2", icon: "flag" },
  { id: "toilet",    label: "トイレ",   color: "#2a9d9d", icon: "toilet" },
  { id: "firstaid",  label: "救護",     color: "#d6453f", icon: "cross" },
  { id: "food",      label: "飲食",     color: "#e8743b", icon: "food" },
  { id: "rest",      label: "休憩所",   color: "#6aa84f", icon: "seat" },
  { id: "stage",     label: "ステージ", color: "#c0457a", icon: "stage" },
  { id: "booth",     label: "体験ブース",color: "#d9a022", icon: "booth" },
  { id: "lost",      label: "落とし物", color: "#7a8087", icon: "search" },
];

export const SPOTS: Spot[] = [
  { id: "reception-main", name: "中央受付", cat: "reception", x: 500, y: 1150,
    place: "正面ゲートを入ってすぐ正面",
    desc: "総合受付。パンフレット配布・お問い合わせ・迷子のお預かりに対応しています。",
    note: "車いす・ベビーカーの貸出もこちらで承ります。",
    keywords: ["うけつけ","総合","案内","パンフレット","問い合わせ"] },
  { id: "reception-west", name: "西受付", cat: "reception", x: 175, y: 720,
    place: "西ゲートを入ってすぐ右",
    desc: "西ゲート専用の受付。混雑時はこちらからの入場もご利用ください。",
    keywords: ["うけつけ","西","入口","サブ"] },
  { id: "hq", name: "本部テント", cat: "hq", x: 650, y: 880,
    place: "中央広場の東側",
    desc: "運営本部。アナウンス・スタッフ呼び出し・各種お問い合わせに対応します。",
    note: "落とし物のお預かり・お渡しもこちらです。",
    keywords: ["ほんぶ","運営","スタッフ","事務局","アナウンス"] },
  { id: "firstaid", name: "救護所", cat: "firstaid", x: 720, y: 960,
    place: "本部テントの隣",
    desc: "体調不良・けがの応急手当に対応します。お気軽にスタッフへお声がけください。",
    note: "熱中症対策に、こまめな水分補給を。",
    keywords: ["きゅうご","けが","体調","応急","医務","熱中症"] },
  { id: "nursing", name: "授乳・おむつ替え室", cat: "firstaid", x: 760, y: 760,
    place: "救護所の奥",
    desc: "授乳スペースとおむつ替え台をご用意しています。ご自由にご利用ください。",
    keywords: ["じゅにゅう","おむつ","ベビー","赤ちゃん","子ども"] },
  { id: "toilet-north", name: "トイレ（北）", cat: "toilet", x: 300, y: 380,
    place: "メインステージ西側",
    desc: "多目的トイレを併設しています。",
    keywords: ["といれ","お手洗い","トイレ","北","WC"] },
  { id: "toilet-south", name: "トイレ（南）", cat: "toilet", x: 330, y: 1080,
    place: "正面ゲート西側",
    desc: "正面ゲート近くのトイレです。",
    keywords: ["といれ","お手洗い","トイレ","南","WC"] },
  { id: "toilet-multi", name: "多目的トイレ", cat: "toilet", x: 730, y: 1110,
    place: "正面ゲート東側",
    desc: "車いす・オストメイト対応。ベビーチェアもあります。",
    keywords: ["たもくてき","バリアフリー","車いす","多機能","トイレ"] },
  { id: "food-cars", name: "キッチンカー広場", cat: "food", x: 290, y: 700,
    place: "西エリアの芝生沿い",
    desc: "地元の人気キッチンカーが10台以上集合。クレープ・からあげ・ドリンクなど。",
    note: "ピーク時間（12〜13時）は混み合います。",
    keywords: ["きっちんかー","フード","屋台","ごはん","食事","グルメ","飲食"] },
  { id: "food-local", name: "地元グルメ屋台", cat: "food", x: 360, y: 820,
    place: "キッチンカー広場の南",
    desc: "商店街・農産物直売など地元自慢の味が並びます。",
    keywords: ["やたい","地元","商店街","直売","グルメ","飲食"] },
  { id: "rest-tent", name: "休憩テント", cat: "rest", x: 720, y: 620,
    place: "中央広場の北東",
    desc: "屋根付きの休憩スペース。テーブル・ベンチがあり、飲食もできます。",
    keywords: ["きゅうけい","休む","テント","ベンチ","日陰"] },
  { id: "rest-lawn", name: "芝生休憩エリア", cat: "rest", x: 800, y: 440,
    place: "東側の芝生広場",
    desc: "レジャーシートを広げてくつろげる芝生エリア。ペット同伴は通路のみ可。",
    keywords: ["しばふ","ひろば","休憩","ピクニック","レジャー"] },
  { id: "stage", name: "メインステージ", cat: "stage", x: 500, y: 250,
    place: "会場最奥（北側）",
    desc: "ダンス・音楽ライブ・ビンゴ大会などを開催。タイムテーブルは本部で配布中。",
    note: "15:00〜キッズダンスステージ。前方は立ち見エリアです。",
    keywords: ["すてーじ","ライブ","音楽","ダンス","イベント","ビンゴ"] },
  { id: "workshop", name: "ワークショップブース", cat: "booth", x: 250, y: 520,
    place: "北西エリア",
    desc: "工作・自然体験・手づくり体験など。当日参加OK（一部有料）。",
    keywords: ["わーくしょっぷ","体験","工作","手づくり","ブース"] },
  { id: "kids", name: "キッズ縁日", cat: "booth", x: 640, y: 1110,
    place: "正面ゲート東側",
    desc: "ヨーヨーすくい・スーパーボールすくい・輪投げなど。お子さまに大人気。",
    keywords: ["きっず","えんにち","縁日","子ども","あそび","ゲーム","ブース"] },
  { id: "lost", name: "落とし物センター", cat: "lost", x: 600, y: 900,
    place: "本部テント内",
    desc: "落とし物のお預かり・お問い合わせはこちら。お心当たりの方はお声がけください。",
    keywords: ["おとしもの","忘れ物","遺失","なくした"] },
];

export const NOTICES: Notice[] = [
  { id: "n1", cat: "important", title: "南ゲート付近が混雑しています", time: "13:20", pinned: true,
    body: "現在、正面（南）ゲート付近が大変混み合っています。西ゲートからの入退場もあわせてご利用ください。場内アナウンスでも順次ご案内します。" },
  { id: "n2", cat: "crowd", title: "キッチンカー広場が混み合っています", time: "12:50",
    body: "お昼のピークで、キッチンカー広場が混雑しています。地元グルメ屋台や東側のお店もあわせてご検討ください。" },
  { id: "n3", cat: "lost", title: "青い水筒を本部でお預かりしています", time: "12:30",
    body: "メインステージ付近で青いステンレス水筒の落とし物がありました。本部テント（落とし物センター）でお預かりしています。" },
  { id: "n4", cat: "notice", title: "15:00からキッズダンスステージ開催", time: "11:00",
    body: "メインステージにて、15:00より地域キッズダンスチームによるステージを開催します。前方は立ち見エリアです。ぜひお越しください。" },
  { id: "n5", cat: "change", title: "一部ワークショップの場所変更", time: "10:40",
    body: "天候の都合により、午後の「自然工作ワークショップ」は休憩テントへ会場を変更します。お間違えのないようご注意ください。" },
  { id: "n6", cat: "other", title: "フリーWi-Fiをご利用いただけます", time: "9:00",
    body: "会場内では無料Wi-Fi「FESTA-FREE」をご利用いただけます。パスワードは不要です。混雑時はつながりにくい場合があります。" },
];

export const NOTICE_CATS: Record<string, NoticeCat> = {
  important: { label: "重要",     color: "#d6453f" },
  crowd:     { label: "混雑",     color: "#e8743b" },
  lost:      { label: "落とし物", color: "#2f7dd1" },
  notice:    { label: "告知",     color: "#1f8a5b" },
  change:    { label: "変更",     color: "#6b5bd2" },
  other:     { label: "その他",   color: "#7a8087" },
};

export const EVENT: EventInfo = {
  name: "みなと市民ふれあいフェスタ 2026",
  short: "ふれあいフェスタ",
  date: "2026年6月6日（土）10:00–16:00",
  venue: "みなと中央公園",
  surveyUrl: "https://docs.google.com/forms/",
};

export function catById(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}
