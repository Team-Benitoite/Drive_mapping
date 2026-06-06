# Drive Mapping (MVP)

ツーリングルートを記録・共有するサービスの MVP。
「走って楽しいルート」を他のユーザーと共有・参照できることを目指す。

## 技術スタック

| 区分 | 採用 |
| :-- | :-- |
| フロントエンド | React 18 + Vite |
| ルーティング | React Router v6 |
| 地図 | Leaflet + React-Leaflet（OpenStreetMap タイル、APIキー不要） |
| データ層 | 切り替え式（`local` = localStorage / `supabase` = PostgreSQL + Auth） |

## バックエンドの切り替え

データ操作と認証は [`src/api/`](src/api/) の**抽象レイヤ**に集約されており、
`.env` の `VITE_BACKEND` を変えるだけで実装を差し替えられる。

| 値 | 実装 | 用途 |
| :-- | :-- | :-- |
| `local`（既定） | [`src/api/local.js`](src/api/local.js) | localStorage に保存。外部サービス不要でそのまま動く。 |
| `supabase` | [`src/api/supabaseApi.js`](src/api/supabaseApi.js) | Supabase（PostgreSQL + Auth、JWT ベース、RLS で権限制御）。 |

ページ（[Index](src/pages/Index.jsx) / [RouteCreate](src/pages/RouteCreate.jsx) / [RouteDetail](src/pages/RouteDetail.jsx)）と
[AuthContext](src/contexts/AuthContext.jsx) は抽象 API のみを呼ぶため、切り替え時にページの変更は不要。

> ⚠️ `local` バックエンドはパスワードを平文で localStorage に保存する**学習・デモ用の簡易実装**。
> 本番運用では `supabase` に切り替えること。

## MVP 機能

- 認証：新規登録 / ログイン / ログアウト（Supabase Auth）
- ルート投稿：地図クリックで出発地〜中間地〜到着地を指定し DB へ保存（`m_create`）
- ルート一覧：投稿された全ルートを都道府県で絞り込み表示（`index` / `show`）
- ルート詳細：地図上にルートを描画、いいね、本人なら削除（`detail`）

## セットアップ（ローカル／既定）

外部サービスは不要。これだけで動く。

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 が開く。`.env` が無くても既定で `local` バックエンドが使われる。

## Supabase に切り替える場合

1. [supabase.com](https://supabase.com/) で無料プロジェクトを作成
2. ダッシュボードの **SQL Editor** で [`supabase/schema.sql`](supabase/schema.sql) を実行
   （テーブル・RLS ポリシー・プロフィール自動作成トリガーが作成される）
3. **Project Settings > API** から `Project URL` と `anon public` キーを控える
4. `.env` を作成して設定：

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_BACKEND=supabase
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

5. 開発サーバーを再起動（`npm run dev`）

> メール確認をスキップしてすぐ動作確認したい場合は、
> **Authentication > Providers > Email** の「Confirm email」をオフにする。

## デモの流れ（要件 2.4）

1. 「新規登録」から表示名・メール・パスワードで登録
2. ログイン
3. 「ルートを投稿」→ 地図をクリックして地点を追加 → 保存
4. 一覧（トップ）に反映され、詳細画面で地図上にルートが表示されることを確認

## 補足・今後の拡張

- 現状の地図ルートは経由地を直線で結んだもの。実道路に沿った描画は OSRM などのルーティング API を追加すると実現可能。
- 写真アップロード（`route_photos`）は Supabase Storage を使って拡張予定（MVP では未実装）。
- プロフィール / フォロー機能は MVP スコープ外。
