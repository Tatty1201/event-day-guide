"use client";
import { useRef, useState, useMemo, useEffect } from "react";
import FestivalMap, { type FestivalMapHandle } from "./FestivalMap";
import BottomSheet from "./BottomSheet";
import SheetHead from "./SheetHead";
import SpotCard from "./SpotCard";
import NoticeCard from "./NoticeCard";
import CatDot from "./CatDot";
import Icon from "./Icon";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";
import { track } from "@/lib/track";
import {
  CATEGORIES, SPOTS, NOTICES, NOTICE_CATS, EVENT, catById,
  type Spot, type Notice,
} from "@/data/data";

type Props = { initialNotices?: Notice[] };

type Sheet = "search" | "results" | "spot" | "notices" | "notice" | "filter" | "survey" | null;
type LocState = "idle" | "asking" | "loading" | "granted" | "denied";

const QUICK = ["toilet", "reception", "food", "rest", "firstaid", "stage"];
const PRIORITY_LINKS = ["toilet", "reception", "firstaid", "hq"];
const NOTICE_TABS = [
  { id: "all", label: "すべて" },
  { id: "important", label: "重要" },
  { id: "crowd", label: "混雑" },
  { id: "lost", label: "落とし物" },
  { id: "notice", label: "告知" },
  { id: "change", label: "変更" },
];

function matchSpots(q: string): Spot[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return SPOTS.filter((sp) => {
    const cat = catById(sp.cat);
    return (
      sp.name.toLowerCase().includes(s) ||
      cat.label.includes(s) ||
      sp.place.includes(s) ||
      sp.keywords.some((k) => k.includes(s) || s.includes(k))
    );
  });
}

export default function App({ initialNotices }: Props) {
  const notices = initialNotices ?? NOTICES;
  const mapRef = useRef<FestivalMapHandle>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [prevSheet, setPrevSheet] = useState<Sheet>(null);
  const [selected, setSelected] = useState<Spot | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Spot[]>([]);
  const [resultLabel, setResultLabel] = useState("");
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);
  const [noticeTab, setNoticeTab] = useState("all");
  const [visibleCats, setVisibleCats] = useState<Set<string>>(
    () => new Set(CATEGORIES.map((c) => c.id))
  );
  const [userLoc, setUserLoc] = useState<{ x: number; y: number; acc: number } | null>(null);
  const [locState, setLocState] = useState<LocState>("idle");
  const [toast, setToast] = useState<string | null>(null);

  const visibleSpots = useMemo(
    () => SPOTS.filter((s) => visibleCats.has(s.cat)),
    [visibleCats]
  );
  const importantNotice = notices.find((n) => n.cat === "important") ?? notices[0];
  const visibleNotices = useMemo(
    () => notices.filter((n) => noticeTab === "all" || n.cat === noticeTab),
    [notices, noticeTab]
  );

  useEffect(() => {
    if (sheet === "search") {
      setTimeout(() => searchInputRef.current?.focus(), 120);
    }
  }, [sheet]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    track("page_view", { event: EVENT.short });
  }, []);

  const showToast = (msg: string) => setToast(msg);

  const handleChipTap = () => {
    tapCountRef.current++;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setAdminLoginOpen(true);
    } else {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);
    }
  };

  const openSpot = (spot: Spot, from?: Sheet) => {
    track("spot_open", { spotId: spot.id, category: spot.cat, from: from ?? sheet ?? "map" });
    setSelected(spot);
    setPrevSheet(from ?? null);
    setSheet("spot");
    mapRef.current?.flyTo(spot.x, spot.y);
  };

  const runSearch = (q: string, label?: string) => {
    const matched = matchSpots(q);
    track("search_submit", { query: q.trim(), results: matched.length });
    setResults(matched);
    setResultLabel(label ?? `「${q}」`);
    setQuery(q);
    setSheet("results");
  };

  const quickSearch = (catId: string) => {
    const cat = catById(catId);
    const matched = SPOTS.filter((s) => s.cat === catId);
    track("quick_category", { category: catId, results: matched.length });
    setResults(matched);
    setResultLabel(cat.label);
    setQuery(cat.label);
    setSheet("results");
  };

  const requestLocation = () => {
    track("location_request", { state: locState });
    if (locState === "granted" && userLoc) {
      mapRef.current?.flyTo(userLoc.x, userLoc.y);
      showToast("現在地はおおよその位置です");
      return;
    }
    setLocState("asking");
  };

  const grantLocation = () => {
    track("location_grant");
    setLocState("loading");
    setTimeout(() => {
      const loc = { x: 520, y: 1080, acc: 95 };
      setUserLoc(loc);
      setLocState("granted");
      mapRef.current?.flyTo(loc.x, loc.y);
      showToast("おおよその現在地を表示しました");
    }, 1100);
  };

  const denyLocation = () => {
    track("location_deny");
    setLocState("denied");
    showToast("位置情報なしでも、検索とカテゴリから探せます");
  };

  const toggleCat = (id: string) => {
    track("category_toggle", { category: id, visible: !visibleCats.has(id) });
    setVisibleCats((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const closeSheet = () => {
    track("sheet_close", { sheet: sheet ?? "none" });
    setSheet(null);
    setSelected(null);
  };

  return (
    <div className="app">
      {/* MAP */}
      <FestivalMap
        ref={mapRef}
        spots={visibleSpots}
        selectedId={selected?.id ?? null}
        onSelect={(s) => openSpot(s)}
        onMapTap={() => { if (sheet) closeSheet(); }}
        userLocation={userLoc}
      />

      {/* TOP CHROME */}
      {!sheet && (
        <div className="top-chrome">
          <div className="event-chip" onClick={handleChipTap}>
            <span className="event-mark" />
            <span>{EVENT.short}</span>
            <span className="event-date">10:00–16:00</span>
          </div>
          <button className="announce" onClick={() => { track("notice_banner_open"); setNoticeTab("all"); setSheet("notices"); }}>
            <span className="announce-badge"><Icon name="warning" size={14} stroke={2.6} /></span>
            <span className="announce-label">重要</span>
            <span className="announce-text">{importantNotice.title}</span>
            <Icon name="chevronRight" size={18} className="announce-arrow" />
          </button>
          <button className="search-pill" onClick={() => { track("search_open"); setSheet("search"); }}>
            <Icon name="search" size={20} className="muted" />
            <span>トイレ・受付・ブースを探す</span>
          </button>
          <div className="priority-links" aria-label="よく使う案内">
            {PRIORITY_LINKS.map((id) => {
              const c = catById(id);
              return (
                <button key={id} className="priority-link" onClick={() => quickSearch(id)}>
                  <span className="priority-ic" style={{ color: c.color }}>
                    <Icon name={c.icon} size={18} stroke={2.3} />
                  </span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* LOC FAB */}
      {!sheet && (
        <button
          className={"loc-fab" + (locState === "granted" ? " on" : "")}
          onClick={requestLocation} aria-label="現在地"
        >
          {locState === "loading"
            ? <span className="spinner" />
            : <Icon name="locate" size={24} stroke={2.2} />}
        </button>
      )}

      {/* SHEETS */}
      <BottomSheet open={sheet === "search"} onClose={closeSheet} snaps={[0.92]}>
        <div className="search-head">
          <button className="head-icon" onClick={closeSheet} aria-label="戻る">
            <Icon name="back" size={22} />
          </button>
          <div className="search-field">
            <Icon name="search" size={20} className="muted" />
            <input
              ref={searchInputRef}
              value={query}
              placeholder="場所・カテゴリを入力"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) runSearch(query); }}
            />
            {query && (
              <button className="clear-btn" onClick={() => setQuery("")} aria-label="クリア">
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        </div>
        {!query.trim() ? (
          <div className="search-body">
            <p className="search-hint">よく探される場所</p>
            <div className="chip-row">
              {QUICK.map((id) => {
                const c = catById(id);
                return (
                  <button key={id} className="quick-chip" onClick={() => quickSearch(id)}>
                    <span className="chip-ic" style={{ color: c.color }}>
                      <Icon name={c.icon} size={16} stroke={2.2} />
                    </span>
                    {c.label}
                  </button>
                );
              })}
            </div>
            <p className="search-hint">すべてのスポット</p>
            <div className="suggest-list">
              {SPOTS.map((s) => <SpotCard key={s.id} spot={s} onClick={() => openSpot(s, "search")} />)}
            </div>
          </div>
        ) : (
          <div className="search-body">
            {(() => {
              const list = matchSpots(query);
              if (!list.length) return (
                <div className="empty">
                  <p className="empty-title">「{query}」は見つかりませんでした</p>
                  <p className="empty-sub">別のことばでお試しください。</p>
                  <div className="chip-row">
                    {QUICK.map((id) => {
                      const c = catById(id);
                      return (
                        <button key={id} className="quick-chip" onClick={() => quickSearch(id)}>
                          <span className="chip-ic" style={{ color: c.color }}>
                            <Icon name={c.icon} size={16} stroke={2.2} />
                          </span>
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
              return (
                <div className="suggest-list">
                  <p className="search-hint">{list.length}件の候補</p>
                  {list.map((s) => <SpotCard key={s.id} spot={s} onClick={() => openSpot(s, "search")} />)}
                </div>
              );
            })()}
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={sheet === "results"} onClose={closeSheet} snaps={[0.46, 0.86]}>
        <SheetHead title="検索結果" sub={`${resultLabel}・${results.length}件`} onClose={closeSheet} />
        <div className="list-pad">
          {results.length
            ? results.map((s) => <SpotCard key={s.id} spot={s} onClick={() => openSpot(s, "results")} />)
            : <div className="empty"><p className="empty-title">該当するスポットがありません</p></div>}
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === "spot"} onClose={closeSheet} snaps={[0.42, 0.74]}>
        {selected && (() => {
          const c = catById(selected.cat);
          return (
            <div className="spot-detail">
              <div className="spot-detail-head">
                <CatDot cat={selected.cat} size={48} />
                <div className="spot-detail-title">
                  <span className="cat-tag" style={{ color: c.color }}>{c.label}</span>
                  <h2>{selected.name}</h2>
                </div>
                <button className="head-icon" onClick={closeSheet} aria-label="閉じる">
                  <Icon name="close" size={20} />
                </button>
              </div>
              <div className="place-line">
                <Icon name="pin" size={18} style={{ color: c.color }} />
                <span>{selected.place}</span>
              </div>
              <p className="spot-desc">{selected.desc}</p>
              {selected.note && (
                <div className="spot-note">
                  <Icon name="info" size={18} /><span>{selected.note}</span>
                </div>
              )}
              <div className="spot-actions">
                <button className="btn primary" onClick={() => mapRef.current?.flyTo(selected.x, selected.y)}>
                  <Icon name="pin" size={18} stroke={2.2} />マップで確認
                </button>
                {prevSheet === "results" && (
                  <button className="btn ghost" onClick={() => setSheet("results")}>
                    <Icon name="back" size={18} />結果に戻る
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </BottomSheet>

      <BottomSheet open={sheet === "notices"} onClose={closeSheet} snaps={[0.56, 0.92]}>
        <SheetHead title="お知らせ" sub="当日の最新情報" onClose={closeSheet} />
        <div className="tab-row">
          {NOTICE_TABS.map((t) => (
            <button key={t.id} className={"tab" + (noticeTab === t.id ? " active" : "")} onClick={() => { track("notice_tab", { tab: t.id }); setNoticeTab(t.id); }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="list-pad notices">
          {visibleNotices.length ? (
            visibleNotices.map((n) => (
              <NoticeCard key={n.id} notice={n} onClick={() => { track("notice_open", { noticeId: n.id, category: n.cat }); setActiveNotice(n); setSheet("notice"); }} />
            ))
          ) : (
            <div className="empty compact">
              <p className="empty-title">該当するお知らせはありません</p>
              <p className="empty-sub">最新情報は重要欄と場内アナウンスで確認できます。</p>
            </div>
          )}
          <div className="survey-inline">
            <div className="survey-inline-text">
              <strong>ご来場アンケート</strong>
              <span>3分で回答・次回の改善に役立てます</span>
            </div>
            <button className="btn primary sm" onClick={() => { track("survey_prompt_open"); setSheet("survey"); }}>
              <Icon name="external" size={16} />回答する
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === "notice"} onClose={closeSheet} snaps={[0.5, 0.82]}>
        {activeNotice && (() => {
          const nc = NOTICE_CATS[activeNotice.cat] ?? NOTICE_CATS.other;
          return (
            <div className="notice-detail">
              <SheetHead
                onBack={() => setSheet("notices")} onClose={closeSheet}
                title={<span className="notice-badge" style={{ background: nc.color }}>{nc.label}</span>}
              />
              <h2 className="notice-detail-title">{activeNotice.title}</h2>
              <p className="notice-detail-time">
                <Icon name="clock" size={14} className="muted" />{activeNotice.time} 更新
              </p>
              <p className="notice-detail-body">{activeNotice.body}</p>
              {activeNotice.cat === "lost" && (
                <div className="spot-actions">
                  <button className="btn ghost" onClick={() => {
                    const sp = SPOTS.find((s) => s.id === "lost");
                    if (sp) openSpot(sp, "notice");
                  }}>
                    <Icon name="pin" size={18} />落とし物センターを地図で見る
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </BottomSheet>

      <BottomSheet open={sheet === "filter"} onClose={closeSheet} snaps={[0.62, 0.88]}>
        <SheetHead
          title="表示する場所" sub="地図のピンを絞り込む" onClose={closeSheet}
          right={
            <button className="link-btn" onClick={() => setVisibleCats(new Set(CATEGORIES.map((c) => c.id)))}>
              すべて表示
            </button>
          }
        />
        <div className="filter-grid">
          {CATEGORIES.map((c) => {
            const on = visibleCats.has(c.id);
            return (
              <button key={c.id} className={"filter-item" + (on ? " on" : "")} onClick={() => toggleCat(c.id)}>
                <span className="cat-dot" style={{ width: 34, height: 34, background: on ? c.color : "#c4c9c2" }}>
                  <Icon name={c.icon} size={18} stroke={2.2} />
                </span>
                <span className="filter-label">{c.label}</span>
                <span className={"check" + (on ? " on" : "")}>
                  {on && <Icon name="check" size={14} stroke={3} />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="filter-foot">
          <button className="btn ghost" onClick={() => setVisibleCats(new Set())}>すべて非表示</button>
          <button className="btn primary" onClick={closeSheet}>地図に反映</button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === "survey"} onClose={closeSheet} snaps={[0.5]} dimEnabled>
        <div className="survey-sheet">
          <div className="survey-illu"><Icon name="clipboard" size={34} stroke={1.8} /></div>
          <h2>ご来場アンケート</h2>
          <p>会場の感想や気になった点をお聞かせください。所要約3分。回答はGoogleフォームで受け付けます。</p>
          <button className="btn primary lg" onClick={() => { track("survey_external_open"); window.open(EVENT.surveyUrl, "_blank"); closeSheet(); }}>
            <Icon name="external" size={18} />アンケートを開く
          </button>
          <button className="btn text" onClick={closeSheet}>あとで</button>
        </div>
      </BottomSheet>

      {/* LOCATION PERMISSION */}
      {locState === "asking" && (
        <div className="perm-backdrop">
          <div className="perm-dialog">
            <p className="perm-q"><strong>{EVENT.short}ガイド</strong>が位置情報の使用を求めています</p>
            <p className="perm-sub">現在地はおおよその位置として地図に表示されます。記録・保存はされません。</p>
            <div className="perm-actions">
              <button onClick={denyLocation}>許可しない</button>
              <button className="allow" onClick={grantLocation}>許可</button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        <button
          className={"nav-btn" + (sheet === "notices" || sheet === "notice" ? " active" : "")}
          onClick={() => { track("nav_open", { target: "notices" }); setNoticeTab("all"); setSheet("notices"); }}
        >
          <span className="nav-ic"><Icon name="bell" size={23} /><span className="nav-dot" /></span>
          <span>お知らせ</span>
        </button>
        <button className={"nav-btn" + (sheet === "filter" ? " active" : "")} onClick={() => { track("nav_open", { target: "filter" }); setSheet("filter"); }}>
          <Icon name="layers" size={23} /><span>カテゴリ</span>
        </button>
        <button className={"nav-btn" + (locState === "granted" ? " active" : "")} onClick={requestLocation}>
          <Icon name="locate" size={23} /><span>現在地</span>
        </button>
        <button className="nav-btn survey" onClick={() => { track("nav_open", { target: "survey" }); setSheet("survey"); }}>
          <Icon name="clipboard" size={23} /><span>アンケート</span>
        </button>
      </nav>

      {toast && <div className="toast">{toast}</div>}

      {adminLoginOpen && (
        <AdminLogin
          onLogin={(pw) => {
            setAdminPassword(pw);
            setAdminLoginOpen(false);
            setAdminPanelOpen(true);
          }}
          onClose={() => setAdminLoginOpen(false)}
        />
      )}

      {adminPanelOpen && (
        <AdminPanel
          adminPassword={adminPassword}
          onClose={() => setAdminPanelOpen(false)}
        />
      )}
    </div>
  );
}
