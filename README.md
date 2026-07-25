# Drive Mapping

既存PHP版 `Drive_mapping` を、React + Supabase構成へ移植したMVSです。

MVSの目的は、デザインや追加機能を作り込む前に、既存版と同じ主要機能を動かすことです。

## 技術構成

- React
- Vite
- Supabase Auth
- Supabase Database
- Supabase Storage

このフォルダーはチーム共有用に整理済みです。旧PHP版、生成物、ローカル環境ファイルは含めていません。

## フォルダー構成

- `src`: Reactアプリ本体
- `public`: 画像などの静的ファイル
- `supabase`: Supabase SQL
- `docs`: 要件定義・チーム共有資料
- `.env.example`: 環境変数サンプル

## セットアップ

1. 依存関係をインストールします。

```bash
npm install
```

2. `.env.example` を参考に `.env` を作成します。

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_STORAGE_BUCKET=route-photos
VITE_GOOGLE_MAPS_EMBED_API_KEY=your-google-maps-embed-api-key
```

`your-project-ref` と `your-supabase-anon-key` はサンプル値です。
Supabase管理画面の Project Settings > API から、Project URL と anon public key をコピーして設定してください。

`VITE_GOOGLE_MAPS_EMBED_API_KEY` は投稿詳細にGoogle Maps経路を埋め込む場合だけ必要です。未設定でも「登録地点から経路を開く」と「保存した共有経路を開く」は利用できます。設定する場合はGoogle Cloudで Maps Embed API を有効にし、APIキーにHTTPリファラー制限とMaps Embed APIのAPI制限を設定してください。

`.env` を変更した後は、起動中の `npm run dev` を停止して再起動してください。

3. SupabaseのSQL Editorで [supabase/schema.sql](supabase/schema.sql) を実行します。

既存のSupabase環境へGoogle Maps共有URL機能だけを追加する場合は、[supabase/google-maps-migration.sql](supabase/google-maps-migration.sql) を実行してください。

4. 開発サーバーを起動します。

```bash
npm run dev
```

標準URLは `http://localhost:5173` です。

## MVS機能

- 新規登録
- ログイン
- ログアウト
- 日本地図トップ
- 都道府県別の投稿一覧
- キーワード検索
- ルート投稿作成
- ルート詳細
- 投稿編集
- 投稿削除
- 写真アップロード
- いいね
- お気に入り一覧
- プロフィール編集
- フォロー / フォロワー一覧
- 登録地点からGoogle Maps経路を表示
- Google Maps共有URLの保存・表示
- Google Maps経路のアプリ内埋め込み（APIキー設定時）

## Supabaseメモ

- Authはメールアドレスとパスワードを使います。
- ユーザー登録時に `profiles` レコードを作るトリガーをSQLに含めています。
- Storage bucketは投稿写真に `route-photos`、プロフィール画像に `profile-icons` を使います。
- プロフィール機能・フォロー機能を使う前に、最新版の [supabase/schema.sql](supabase/schema.sql) をSupabase SQL Editorで再実行してください。
- MVSではサムネイル生成は必須にしていません。登録画像をそのまま一覧と詳細で表示します。
- RLSは必ず有効にしてください。

## デプロイ手順（Vercel）

1. GitHubに最新のコードをpushします。

2. Vercelで `Team-Benitoite/Drive_mapping` リポジトリをImportします。

3. Project Settings > Environment Variables に以下を設定します。

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_STORAGE_BUCKET=route-photos
VITE_GOOGLE_MAPS_EMBED_API_KEY=your-google-maps-embed-api-key
```

4. Build Settings は通常、自動検出のままで問題ありません。

```bash
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

5. SupabaseのSQL Editorで、最新版の [supabase/schema.sql](supabase/schema.sql) を実行します。

6. Supabaseの Authentication > URL Configuration に、Vercelで発行されたURLを設定します。

```text
Site URL: https://your-vercel-project.vercel.app
Redirect URLs: https://your-vercel-project.vercel.app
```

7. SupabaseプロジェクトがPausedの場合は、Resumeしてから動作確認します。

`vercel.json` でSPA用のリライト設定を入れているため、`/routes/1` や `/profile` を直接開いても `index.html` が表示されます。

## 先生・確認者向け

公開URLがある場合は、そのURLを開くだけでアプリを確認できます。

未デプロイの場合は、上記「デプロイ手順（Vercel）」に従ってVercelへデプロイしてください。

Supabaseの環境変数は管理者から共有された値を使用してください。

## チーム開発ルール

詳しい要件は [docs/team-requirements.md](docs/team-requirements.md) を確認してください。

このMVSでは、デザインの作り込みよりも既存Drive_mappingと同じ機能の移植を優先します。
