"use client";
import { useState, useEffect, useCallback } from "react";
import Icon from "./Icon";
import { NOTICE_CATS, SPOTS, NOTICES, CATEGORIES } from "@/data/data";

type AdminNotice = {
  id: string;
  cat: string;
  title: string;
  time: string;
  body: string;
  pinned?: boolean;
  status: string;
  created_at?: string;
};

type Stats = {
  activeSessions: number;
  totalEvents: number;
  spotRanking: { spotId: string; count: number }[];
  searchKeywords: { query: string; count: number; zeroResults: number }[];
  noticeViews: { noticeId: string; count: number }[];
  categoryUsage: { category: string; count: number }[];
  hourly: { hour: number; count: number }[];
  location: { request: number; grant: number; deny: number; grantRate: number };
  generatedAt: string;
};

const spotName = (id: string) => SPOTS.find((s) => s.id === id)?.name ?? id;
const noticeTitle = (id: string) => NOTICES.find((n) => n.id === id)?.title ?? id;
const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

type Props = {
  adminPassword: string;
  onClose: () => void;
};

const STATUS_LABEL: Record<string, string> = {
  published: "公開中",
  hidden: "非表示",
  deleted: "削除済み",
  draft: "下書き",
};

export default function AdminPanel({ adminPassword, onClose }: Props) {
  const [notices, setNotices] = useState<AdminNotice[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">("idle");
  const [view, setView] = useState<"post" | "list" | "stats">("post");

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsState, setStatsState] = useState<"idle" | "loading" | "error">("idle");

  const [formCat, setFormCat] = useState("important");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");

  const adminHeaders = {
    "Content-Type": "application/json",
    "x-edg-admin-password": adminPassword,
  };

  const loadNotices = useCallback(async () => {
    setLoadState("loading");
    try {
      const res = await fetch("/api/notices/admin", {
        headers: { "x-edg-admin-password": adminPassword },
      });
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setNotices(data.notices ?? []);
      setLoadState("idle");
    } catch {
      setLoadState("error");
    }
  }, [adminPassword]);

  const loadStats = useCallback(async () => {
    setStatsState("loading");
    try {
      const res = await fetch("/api/events/stats", {
        headers: { "x-edg-admin-password": adminPassword },
      });
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setStats(data.stats ?? null);
      setStatsState("idle");
    } catch {
      setStatsState("error");
    }
  }, [adminPassword]);

  useEffect(() => {
    if (view === "list") loadNotices();
    if (view === "stats") loadStats();
  }, [view, loadNotices, loadStats]);

  const changeStatus = async (id: string, status: string) => {
    const res = await fetch("/api/notices/admin", {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setNotices((prev) => prev.map((n) => n.id === id ? { ...n, status } : n));
    }
  };

  const submitNotice = async () => {
    if (!formTitle.trim() || submitState === "submitting") return;
    setSubmitState("submitting");
    setSubmitError("");
    try {
      const res = await fetch("/api/notices/admin", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ cat: formCat, title: formTitle.trim(), body: formBody.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error ?? "投稿に失敗しました");
        setSubmitState("error");
        return;
      }
      setFormTitle("");
      setFormBody("");
      setSubmitState("success");
      setTimeout(() => setSubmitState("idle"), 2500);
    } catch {
      setSubmitError("ネットワークエラーが発生しました");
      setSubmitState("error");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <span className="admin-badge-tag">管理</span>
        <div className="admin-tabs">
          <button
            className={"admin-tab" + (view === "post" ? " active" : "")}
            onClick={() => setView("post")}
          >
            投稿
          </button>
          <button
            className={"admin-tab" + (view === "list" ? " active" : "")}
            onClick={() => setView("list")}
          >
            一覧
          </button>
          <button
            className={"admin-tab" + (view === "stats" ? " active" : "")}
            onClick={() => setView("stats")}
          >
            分析
          </button>
        </div>
        <button className="admin-exit" onClick={onClose}>
          <Icon name="close" size={16} />終了
        </button>
      </div>

      <div className="admin-body">
        {view === "post" && (
          <div className="admin-section">
            <p className="admin-section-label">カテゴリ</p>
            <div className="admin-cat-row">
              {Object.entries(NOTICE_CATS).map(([id, cat]) => (
                <button
                  key={id}
                  className={"admin-cat-btn" + (formCat === id ? " active" : "")}
                  style={formCat === id ? { background: cat.color, borderColor: cat.color } : undefined}
                  onClick={() => setFormCat(id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <p className="admin-section-label">
              タイトル <span className="admin-required">必須</span>
            </p>
            <input
              className="admin-input"
              placeholder="例：南ゲート付近が混雑しています"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={80}
            />

            <p className="admin-section-label">
              本文 <span className="admin-optional">省略可</span>
            </p>
            <textarea
              className="admin-textarea"
              placeholder="詳細情報を入力してください"
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={4}
              maxLength={2000}
            />

            {submitState === "error" && (
              <p className="admin-msg error">{submitError}</p>
            )}
            {submitState === "success" && (
              <p className="admin-msg success">投稿しました</p>
            )}

            <button
              className="admin-post-btn"
              onClick={submitNotice}
              disabled={!formTitle.trim() || submitState === "submitting"}
            >
              {submitState === "submitting" ? "投稿中..." : "お知らせを投稿する"}
            </button>
          </div>
        )}

        {view === "list" && (
          <div className="admin-section">
            <div className="admin-list-head">
              <span className="admin-section-label" style={{ margin: 0 }}>
                {loadState === "idle" ? `${notices.length}件` : "読み込み中"}
              </span>
              <button
                className="admin-reload-btn"
                onClick={loadNotices}
                disabled={loadState === "loading"}
              >
                <Icon name="search" size={13} />更新
              </button>
            </div>

            {loadState === "error" && (
              <div className="admin-list-empty">
                <p>読み込みに失敗しました</p>
                <button className="admin-reload-btn" onClick={loadNotices}>再試行</button>
              </div>
            )}

            {loadState === "loading" && (
              <p className="admin-list-empty-text">読み込み中...</p>
            )}

            {loadState === "idle" && notices.length === 0 && (
              <p className="admin-list-empty-text">投稿がありません</p>
            )}

            {loadState === "idle" && notices.length > 0 && (
              <div className="admin-notice-list">
                {notices.map((n) => {
                  const nc = NOTICE_CATS[n.cat] ?? NOTICE_CATS.other;
                  const isDimmed = n.status === "hidden" || n.status === "deleted";
                  return (
                    <div key={n.id} className={"admin-notice-row" + (isDimmed ? " muted" : "")}>
                      <div className="admin-notice-top">
                        <span className="admin-notice-badge" style={{ background: nc.color }}>
                          {nc.label}
                        </span>
                        <span className={"admin-status-chip" + (n.status === "published" ? " pub" : "")}>
                          {STATUS_LABEL[n.status] ?? n.status}
                        </span>
                        <span className="admin-notice-time">{n.time}</span>
                      </div>
                      <p className="admin-notice-title">{n.title}</p>
                      {n.body && <p className="admin-notice-body">{n.body}</p>}
                      <div className="admin-notice-actions">
                        {n.status === "published" && (
                          <button className="admin-act-btn warn" onClick={() => changeStatus(n.id, "hidden")}>
                            非表示
                          </button>
                        )}
                        {n.status === "hidden" && (
                          <button className="admin-act-btn ok" onClick={() => changeStatus(n.id, "published")}>
                            再公開
                          </button>
                        )}
                        {n.status !== "deleted" && (
                          <button className="admin-act-btn del" onClick={() => changeStatus(n.id, "deleted")}>
                            削除扱い
                          </button>
                        )}
                        {n.status === "deleted" && (
                          <button className="admin-act-btn ok" onClick={() => changeStatus(n.id, "published")}>
                            復元
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === "stats" && (
          <div className="admin-section">
            <div className="admin-list-head">
              <span className="admin-section-label" style={{ margin: 0 }}>
                来場者の行動サマリー
              </span>
              <button
                className="admin-reload-btn"
                onClick={loadStats}
                disabled={statsState === "loading"}
              >
                <Icon name="search" size={13} />更新
              </button>
            </div>

            {statsState === "error" && (
              <div className="admin-list-empty">
                <p>読み込みに失敗しました</p>
                <button className="admin-reload-btn" onClick={loadStats}>再試行</button>
              </div>
            )}

            {statsState === "loading" && (
              <p className="admin-list-empty-text">集計中...</p>
            )}

            {statsState === "idle" && stats && (
              <div className="stat-wrap">
                <div className="stat-kpi-row">
                  <div className="stat-kpi">
                    <span className="stat-kpi-num">{stats.activeSessions.toLocaleString()}</span>
                    <span className="stat-kpi-label">来場（端末数）</span>
                  </div>
                  <div className="stat-kpi">
                    <span className="stat-kpi-num">{stats.totalEvents.toLocaleString()}</span>
                    <span className="stat-kpi-label">総アクション</span>
                  </div>
                  <div className="stat-kpi">
                    <span className="stat-kpi-num">{stats.location.grantRate}%</span>
                    <span className="stat-kpi-label">位置情報の許可率</span>
                  </div>
                </div>

                <StatBars
                  title="スポット閲覧ランキング"
                  empty="まだ閲覧データがありません"
                  rows={stats.spotRanking.map((r) => ({ label: spotName(r.spotId), count: r.count }))}
                />

                <div className="stat-block">
                  <p className="stat-block-title">検索キーワード</p>
                  {stats.searchKeywords.length === 0 ? (
                    <p className="stat-empty">まだ検索データがありません</p>
                  ) : (
                    <div className="stat-kw-list">
                      {stats.searchKeywords.map((k) => (
                        <div key={k.query} className="stat-kw-row">
                          <span className="stat-kw-q">{k.query}</span>
                          <span className="stat-kw-meta">
                            {k.count}回
                            {k.zeroResults > 0 && (
                              <span className="stat-kw-zero">未ヒット{k.zeroResults}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <StatBars
                  title="お知らせ閲覧数"
                  empty="まだ閲覧データがありません"
                  rows={stats.noticeViews.map((r) => ({ label: noticeTitle(r.noticeId), count: r.count }))}
                />

                <StatBars
                  title="カテゴリ利用"
                  empty="まだ利用データがありません"
                  rows={stats.categoryUsage.map((r) => ({ label: catLabel(r.category), count: r.count }))}
                />

                <div className="stat-block">
                  <p className="stat-block-title">時間帯別アクション</p>
                  <div className="stat-hours">
                    {(() => {
                      const max = Math.max(1, ...stats.hourly.map((h) => h.count));
                      return stats.hourly
                        .filter((h) => h.hour >= 7 && h.hour <= 20)
                        .map((h) => (
                          <div key={h.hour} className="stat-hour">
                            <div className="stat-hour-bar-track">
                              <div
                                className="stat-hour-bar"
                                style={{ height: `${Math.round((h.count / max) * 100)}%` }}
                                title={`${h.hour}時: ${h.count}`}
                              />
                            </div>
                            <span className="stat-hour-label">{h.hour}</span>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

                <p className="stat-foot">
                  集計時刻: {new Date(stats.generatedAt).toLocaleString("ja-JP")}・直近最大1万件
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBars({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { label: string; count: number }[];
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="stat-block">
      <p className="stat-block-title">{title}</p>
      {rows.length === 0 ? (
        <p className="stat-empty">{empty}</p>
      ) : (
        <div className="stat-bar-list">
          {rows.map((r) => (
            <div key={r.label} className="stat-bar-row">
              <span className="stat-bar-label">{r.label}</span>
              <div className="stat-bar-track">
                <div className="stat-bar-fill" style={{ width: `${Math.round((r.count / max) * 100)}%` }} />
              </div>
              <span className="stat-bar-count">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
