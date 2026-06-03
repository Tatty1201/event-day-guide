"use client";
import { useState } from "react";
import Icon from "./Icon";

type Props = {
  onLogin: (password: string) => void;
  onClose: () => void;
};

export default function AdminLogin({ onLogin, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const submit = async () => {
    if (!password || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/notices/admin", {
        headers: { "x-edg-admin-password": password },
      });
      if (res.ok) {
        onLogin(password);
      } else {
        setError(true);
        setTimeout(() => setError(false), 2500);
      }
    } catch {
      setError(true);
      setTimeout(() => setError(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-backdrop" onClick={onClose}>
      <div className="admin-login-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="admin-login-close" onClick={onClose} aria-label="閉じる">
          <Icon name="close" size={18} />
        </button>
        <div className="admin-login-icon">
          <Icon name="flag" size={26} stroke={2.2} />
        </div>
        <h2 className="admin-login-title">管理モード</h2>
        <p className="admin-login-sub">スタッフ専用</p>
        <input
          className={"admin-login-input" + (error ? " error" : "")}
          type="password"
          placeholder="パスワードを入力"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          autoFocus
        />
        {error && <p className="admin-login-error">パスワードが違います</p>}
        <button
          className="admin-login-btn"
          onClick={submit}
          disabled={!password || loading}
        >
          {loading ? "確認中..." : "ログイン"}
        </button>
      </div>
    </div>
  );
}
