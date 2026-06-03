# Event Day Guide Implementation Notes

## Current Decisions

- Admin entry: open admin login by tapping the event name 5 times.
- Admin auth: demo password is acceptable for now. Keep the implementation easy to replace with per-event secret or real auth later.
- Demo password: default is `admin1234`. Set `EDG_ADMIN_PASSWORD` env var to override.
- Admin auth header: `x-edg-admin-password` (from browser). PATCH also accepts legacy `x-edg-secret` for Zapier/webhook compat.
- Notice categories: editable from the admin screen, not fixed only in code.
- Skins: start with simple color, icon, menu-label, and category style changes. Map editing is out of scope until Froxy has implemented the map side more fully.
- Privacy: add a lower-level privacy policy page and link it from the app footer/menu.

## Phase 1 Admin MVP — Implemented (2026-06-03)

### What was added
- `GET /api/notices/admin` — lists all notices (all statuses). Auth: `x-edg-admin-password` header.
- `POST /api/notices/admin` — creates a notice from admin UI. Auth: same header.
- `PATCH /api/notices/admin` — updated to also accept `x-edg-admin-password` (legacy `x-edg-secret` still works).
- `AdminLogin.tsx` — password modal triggered by 5-tap on event chip. Validates via GET /api/notices/admin.
- `AdminPanel.tsx` — full-screen admin overlay. Tabs: 投稿 (post form) / 一覧 (notice list with status controls).
- Hidden entry: tap `EVENT.short` chip 5 times within 2 seconds.

### Email Route Removed (2026-06-03)
`/api/notices/email` を削除。管理画面から直接投稿できるため不要と判断。Zapier/メール連携は今後も不要。

### Remaining Risks
- **Password in DevTools**: the admin password is sent in an HTTP header from the browser and is visible in browser DevTools. Acceptable for demo; replace with session cookie or token for paid deployments.
- **No session persistence**: closing the tab exits admin mode. Intentional for MVP.
- **Legacy schema fallback**: GET and POST have fallback queries for schemas without `status`/`created_at`. If Supabase returns an unexpected partial schema, the fallback may serve stale data silently.
- **No audit log**: admin actions are not logged to `event_logs`. Add for paid deployments.
- **5-tap window is 2 seconds**: may feel tight on slow devices. Increase to 3 seconds if field reports say so.
- **`EDG_ADMIN_PASSWORD` default `admin1234`**: must be overridden in `.env.local` before any real-world deployment.

## Claude Code Scope

Claude Code should implement the next phase in small, verifiable slices.

### Phase 1: Admin MVP

Goal: event staff can update notices without touching Supabase or email workflows.

Tasks:
- Add hidden admin entry by event-name 5-tap gesture.
- Add admin login modal or sheet using a demo password.
- Store admin session only locally and temporarily.
- Add admin mode UI in the same URL.
- Add notice creation form.
- Add notice list with status controls: publish, hide, republish, delete-as-status.
- Reuse existing `/api/notices/admin` where possible.
- Add a POST endpoint for admin notice creation if the existing email endpoint is not suitable.

Human decisions needed:
- Demo password value.
- Whether admin mode appears as a full-screen panel, bottom sheet, or tabbed overlay.
- Exact Japanese labels for staff-facing controls.

### Phase 2: Editable Categories

Goal: event-specific notice categories can be changed without editing source code.

Tasks:
- Move notice category definitions toward DB or a local config abstraction.
- Allow admin UI to edit category label, color, icon, and visible state.
- Keep a safe fallback category named `other`.
- Keep existing hard-coded categories as fallback while DB migration is incomplete.

Human decisions needed:
- Default category set for demos.
- Whether category edits apply only to notices or also to map spots.

### Phase 3: Privacy Page

Goal: make anonymous event tracking explainable before sales/demo use.

Tasks:
- Add `/privacy` page.
- Explain that the app collects anonymous usage events, not names/emails.
- Mention examples: viewed spots, notice opens, search terms, category taps, approximate app interactions.
- State that precise GPS history and personal identification are not stored in v0.1.
- Link the privacy page from the app.

Human decisions needed:
- Final legal wording before paid deployments.
- Whether each client/event needs a custom operator name.

### Phase 4: Skin Foundation

Goal: prepare for productized customization without building a full map editor yet.

Tasks:
- Introduce a skin config object.
- Include theme colors, category colors, menu labels, and optional icon choices.
- Apply the skin to visitor UI and admin preview.
- Do not implement customer map upload or pin placement yet.

Human decisions needed:
- First demo skin names.
- Which settings are exposed to clients in the subscription version.

## Implementation Constraints

- Keep the visitor app usable without admin login.
- Keep demo auth isolated so it can be replaced later.
- Do not block visitor UI if Supabase is unavailable; keep local fallback behavior.
- Do not expose service role keys to the browser.
- Run `npm run build` after implementation.
- Update `PRD.md` or this file when a decision changes.

## Recommended Next Prompt For Claude Code

```txt
Event Day Guide の管理画面MVPを実装してください。
まず PRD.md と implementation_notes.md を読んでください。
同じURL内でイベント名を5回タップすると管理ログインが開くようにし、demo用途の簡易パスワードで管理モードに入れるようにしてください。
管理画面では、お知らせ投稿、一覧表示、非表示、再公開、削除扱いができるようにしてください。
可能ならお知らせカテゴリの編集UIも最小実装してください。ただしDB移行が必要で大きくなる場合は、カテゴリ設定の抽象化とUIの下準備までに留め、残作業を明記してください。
プライバシーポリシーページ /privacy を追加し、匿名行動ログの取得範囲を説明してください。
既存API/Supabase設計を活かし、変更範囲は最小限にしてください。
実装後は npm run build を通し、README/PRD/implementation_notes.md に残リスクを追記してください。
```

