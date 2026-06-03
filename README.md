# Event Day Guide

イベント当日に来場者がスマホで迷わず行動するための案内アプリ。

地図、スポット検索、お知らせ、メール経由の更新を最小構成でまとめる。詳しい判断基準は [PRD.md](./PRD.md) を参照。

## Getting Started

開発サーバー:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

`.env.local` に以下を設定する。

```bash
EDG_SUPABASE_URL=
EDG_SUPABASE_ANON_KEY=
EDG_SUPABASE_SERVICE_ROLE_KEY=
EDG_WEBHOOK_SECRET=
```

`EDG_SUPABASE_SERVICE_ROLE_KEY` はNext.js Route Handlerからの投稿/更新専用。ブラウザには渡さない。VercelではProduction環境変数として登録する。

## Supabase

初期スキーマは [supabase/schema.sql](./supabase/schema.sql) を Supabase SQL editor で実行する。

既存の `notices` だけで始めている環境では、スキーマ移行前でも来場者画面は静的fallbackで表示できる。投稿の非表示・削除扱いを使う場合は `status` カラムを含む新スキーマへ移行する。

`schema.sql` はRLSを有効化するため、メール投稿と管理Webhookには service role key が必要。

既存の簡易 `notices` テーブルを使っている場合は、まず [supabase/migrate_existing_notices.sql](./supabase/migrate_existing_notices.sql) を実行する。新規プロジェクトにデモデータを入れる場合は [supabase/seed_demo.sql](./supabase/seed_demo.sql) を続けて実行する。

## Anonymous Event Tracking

来場者のクリック/閲覧を匿名セッション単位で `event_logs` に保存する。

収集するもの:

- ページ閲覧
- 検索
- スポット閲覧
- お知らせ閲覧
- カテゴリ操作
- 現在地ボタン操作
- アンケート導線

収集しないもの:

- 氏名、メールアドレスなどの個人情報
- 正確なGPS履歴
- 入力フォームの自由記述本文

## Notice Email Webhook

`POST /api/notices/email`

Headers:

```txt
x-edg-secret: <EDG_WEBHOOK_SECRET>
```

Body:

```json
{
  "subject": "[重要] 南ゲート付近が混雑しています",
  "body": "西ゲートからの入場もご利用ください。"
}
```

件名プレフィックスは `[重要]`, `[混雑]`, `[落とし物]`, `[告知]`, `[変更]` に対応。該当しない場合は `その他` として扱う。

## Notice Admin Webhook

投稿後に非表示・再公開・削除扱いへ変更する。

`PATCH /api/notices/admin`

Headers:

```txt
x-edg-secret: <EDG_WEBHOOK_SECRET>
```

Body:

```json
{
  "id": "email-1780000000000",
  "status": "hidden"
}
```

`status` は `draft`, `published`, `hidden`, `deleted` に対応。
