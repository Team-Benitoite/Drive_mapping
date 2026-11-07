# Drive Mapping 新規開発 要件定義書

## 0. この文書の目的

この文書は、既存の `Drive_mapping` フォルダを参考元として、チームで新しく開発するDrive Mapping発展版の要件と開発前提を統一するためのものです。

今回の最初のゴールは、デザインや追加機能を作り込むことではありません。まずは既存の `Drive_mapping` と同じような機能を持つMVSを完成させます。

各担当者が別々のページを制作しても、使用する技術、画面名、Supabaseのテーブル、権限、命名ルールが分かれないように、この文書を共通仕様として扱います。

ChatGPTなどの生成AIに作業を依頼する場合も、最初にこの文書を読み込ませてから実装を進めてください。

## 1. 基本情報

| 項目 | 内容 |
| --- | --- |
| チーム名 | Benitoite |
| プロダクト名 | Drive Mapping |
| 開発種別 | 既存個人制作アプリを参考にした新規開発 |
| 参考元 | `Drive_mapping` フォルダ |
| 最初の目標 | 既存Drive_mappingと同等機能のMVS |
| 作成日 | 2026-05-16 |
| 最終更新日 | 2026-06-06 |
| GitHub Repository | https://github.com/Team-Benitoite/Drive_mapping.git |
| GitHub Projects | https://github.com/Team-Benitoite/Drive_mapping |

## 2. 開発方針

### 2.1 既存アプリとの関係

既存の `Drive_mapping` は、個人制作されたサンプルアプリです。

新規開発では、既存アプリの次の体験を再現することをMVSの範囲とします。

- 日本地図から都道府県別の投稿一覧へ移動する
- ユーザー登録、ログイン、ログアウトができる
- ツーリングルート投稿を作成、閲覧、編集、削除できる
- ルートに写真を登録し、一覧や詳細で表示できる
- 都道府県やキーワードで投稿を検索できる
- 投稿にいいねできる
- 自分がいいねした投稿をお気に入り一覧で確認できる

既存アプリのデザインを完全再現する必要はありません。ただし、MVS段階では見た目の作り込みよりも、同じ機能が正しく動くことを優先します。

### 2.2 MVSの定義

この文書ではMVSを「Minimum Viable Service」として扱います。

MVSの目的は、チームでデザインや追加機能を議論する前に、サービスの基本動作を通すことです。

MVSで重要なこと:

- 既存Drive_mappingと同じ主要機能が使える
- Supabaseにデータが保存される
- 認証、投稿、閲覧、編集、削除、写真、いいねが一通り動く
- 担当者ごとに実装環境やDB設計が分かれない

MVSで重要ではないこと:

- 凝ったデザイン
- アニメーション
- 独自の追加機能
- 画面ごとの細かい見た目の統一
- 本格的なマップ経路描画

デザインや追加機能は、MVS完成後にチームで改めて検討します。

### 2.3 新規開発で統一する技術

チーム内で開発環境が分かれないよう、次の構成に統一します。

| 領域 | 採用技術 |
| --- | --- |
| フロントエンド | React |
| データベース | Supabase Database |
| 認証 | Supabase Auth |
| 画像保存 | Supabase Storage |
| バックエンド | 原則としてSupabaseを利用。独自Node.js APIはMVSでは作らない |
| 開発環境 | Node.js + npm。必要に応じてViteなどを利用 |
| マップ表示 | MVSでは既存版と同じく日本地図から都道府県一覧へ遷移する形を優先 |

注意: 既存アプリはPHP + MySQLで作られていますが、新規開発ではReact + Supabaseに統一します。担当者ごとにMySQL、PHP、Laravel、独自Node.js APIなどへ分岐しないでください。

## 3. プロダクト概要

### 3.1 一文説明

Drive Mappingは、ツーリングやドライブを趣味にしている人が、走って楽しいルートを記録、共有、検索できるサービスです。

### 3.2 想定ユーザー

| 区分 | 内容 |
| --- | --- |
| 主なユーザー | ツーリング、ドライブ、バイク、車での外出を趣味にしている人 |
| 補助的なユーザー | 外出先や走行ルートを決めかねている人 |
| 利用場面 | 休日の行き先決定、ツーリング前のルート探し、自分の走行記録の共有 |

### 3.3 解決する課題

ユーザーは「どこへ行くか」「どの道を走るか」が決まらないことで、外出自体をやめてしまうことがあります。

Google Mapsや一般的なSNSでは、目的地の情報は探せても、ツーリング特有の「走って楽しい道」「実際に誰かが走ったルート」「写真付きの体験記録」をまとめて探すことが難しいです。

Drive Mappingは、実際に投稿されたルートを都道府県やキーワードから探せるようにし、外出先決定の心理的ハードルを下げます。

## 4. MVSスコープ

### 4.1 MVSで作る機能

MVSでは、既存Drive_mappingと同等の機能に絞ります。

| 優先度 | 機能 | 概要 |
| --- | --- | --- |
| 必須 | ユーザー認証 | Supabase Authで新規登録、ログイン、ログアウト |
| 必須 | トップ画面 | 日本地図または都道府県一覧から投稿一覧へ移動 |
| 必須 | ルート投稿作成 | タイトル、概要、説明、都道府県、地点、写真を登録 |
| 必須 | ルート一覧 | 投稿されたルートを一覧表示 |
| 必須 | ルート詳細 | 投稿の説明、写真、地点、いいね数を表示 |
| 必須 | 都道府県検索 | 都道府県ごとに投稿を絞り込む |
| 必須 | キーワード検索 | タイトル、概要、説明から投稿を検索 |
| 必須 | 投稿編集、削除 | 投稿者本人のみ編集、削除できる |
| 必須 | いいね | ログインユーザーがルートにいいねできる |
| 必須 | お気に入り一覧 | 自分がいいねした投稿を一覧表示 |

### 4.2 MVSでは作らない機能

次の機能はMVSでは対象外です。

- 凝ったUIデザイン
- 画面アニメーション
- フォロー、フォロワー機能
- プロフィール編集機能
- コメント、DMなどの交流機能
- リアルタイムGPSトラッキング
- ナビゲーション機能
- Google Maps APIを使った本格的な経路描画
- ランキング機能
- レスポンシブデザインの細かい作り込み

### 4.3 MVS完成条件

MVSは、次の流れが一気通貫で動作した時点で完成とみなします。

1. Supabase Authでユーザー登録ができる
2. ログイン、ログアウトができる
3. ログインユーザーがルート投稿を作成できる
4. 投稿データがSupabase Databaseに保存される
5. 写真がSupabase Storageに保存される
6. 投稿一覧に作成したルートが表示される
7. 投稿詳細画面で写真、説明、地点情報、いいね数が確認できる
8. ゲストユーザーでも一覧と詳細を閲覧できる
9. 投稿者本人だけが編集、削除できる
10. ログインユーザーがいいね、いいね解除できる
11. 自分がいいねした投稿をお気に入り一覧で確認できる

## 5. 画面設計

### 5.1 画面一覧

ページ担当を分ける場合も、画面名とURLは次の表に合わせてください。

| 画面ID | URL例 | 目的 | 認証 | 主な操作 |
| --- | --- | --- | --- | --- |
| home | `/` | トップ、日本地図、投稿数表示 | 不要 | 都道府県選択、投稿一覧へ移動 |
| signup | `/signup` | ユーザー登録 | 不要 | Supabase Authで登録 |
| login | `/login` | ログイン | 不要 | Supabase Authでログイン |
| logout | `/logout` | ログアウト | 必須 | ログアウト |
| routes_index | `/routes` | 投稿一覧 | 不要 | 検索、絞り込み、詳細へ移動 |
| routes_create | `/routes/new` | 投稿作成 | 必須 | 投稿フォーム入力、写真アップロード |
| routes_show | `/routes/:id` | 投稿詳細 | 不要 | 詳細確認、いいね、編集導線 |
| routes_edit | `/routes/:id/edit` | 投稿編集 | 必須かつ本人 | 投稿内容更新、写真追加、写真削除 |
| routes_delete | 画面なし | 投稿削除 | 必須かつ本人 | 詳細または編集画面から削除 |
| favorites | `/favorites` | いいね済み投稿一覧 | 必須 | お気に入り確認 |

### 5.2 画面ごとの担当時ルール

各担当者は、ページ単体を作る場合でも次の共通ルールを守ります。

- 画面名、URL、Supabaseテーブル名を独自に変更しない
- Supabaseの取得・更新仕様を勝手に変更しない
- 認証が必要な画面では、未ログイン時のリダイレクトまたはエラー表示を実装する
- 投稿者本人だけができる操作は、UI表示だけでなくSupabase Row Level Securityでも制御する
- 日本語UIで統一する
- フォーム項目名はSupabaseのカラム名と合わせる
- MVS段階ではデザインの独自作り込みを優先しない

## 6. Supabase設計

### 6.1 Supabase Auth

ユーザー認証はSupabase Authを利用します。

利用する情報:

- `auth.users.id`: ユーザーID
- `auth.users.email`: メールアドレス

アプリ側で表示名を管理するため、別途 `profiles` テーブルを作成します。

### 6.2 profiles

ユーザー表示情報を管理します。

| カラム | 型の目安 | 内容 |
| --- | --- | --- |
| id | uuid | `auth.users.id` と同じ値 |
| name | text | 表示名 |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

MVSではプロフィール詳細画面やプロフィール編集は作り込みません。投稿者名を表示するために最低限使用します。

### 6.3 routes

ルート投稿の本体を管理します。

| カラム | 型の目安 | 内容 |
| --- | --- | --- |
| id | bigint generated | 主キー |
| user_id | uuid | 投稿者ID。`auth.users.id` を参照 |
| title | text | タイトル。必須 |
| summary | text | 概要 |
| description | text | 詳細説明 |
| address | text | 代表地点の住所 |
| site_url | text | 目的地や参考サイトのURL |
| prefecture_code | int | メイン都道府県コード |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

注意: 新規開発では `site_url` を正式名称とします。既存アプリにある `map_url` のような後方互換用カラム名は使いません。

### 6.4 route_prefectures

ルートが通過する都道府県を管理します。メイン都道府県とサブ都道府県を分けます。

| カラム | 型の目安 | 内容 |
| --- | --- | --- |
| id | bigint generated | 主キー |
| route_id | bigint | ルートID |
| prefecture_code | int | 都道府県コード |
| is_main | boolean | メイン都道府県ならtrue |

### 6.5 route_points

出発地、中間地点、到着地を管理します。

| カラム | 型の目安 | 内容 |
| --- | --- | --- |
| id | bigint generated | 主キー |
| route_id | bigint | ルートID |
| point_type | text | `start`, `middle`, `goal` |
| label | text | 地点名 |
| address | text | 地点住所 |
| sort_order | int | 表示順 |

注意: 新規開発では住所の保存カラムを `address` に統一します。既存アプリのように `url` カラムを住所として使う実装は採用しません。

### 6.6 route_photos

ルートに紐づく写真を管理します。

| カラム | 型の目安 | 内容 |
| --- | --- | --- |
| id | bigint generated | 主キー |
| route_id | bigint | ルートID |
| storage_path | text | Supabase Storage上の画像パス |
| thumb_path | text | サムネイルを作る場合の画像パス。MVSでは任意 |
| sort_order | int | 表示順 |
| created_at | timestamptz | 作成日時 |

MVSではサムネイル生成を必須にしません。Storage上の画像を一覧で表示できればよいです。

### 6.7 route_likes

いいねを管理します。

| カラム | 型の目安 | 内容 |
| --- | --- | --- |
| id | bigint generated | 主キー |
| route_id | bigint | ルートID |
| user_id | uuid | いいねしたユーザーID |
| created_at | timestamptz | 作成日時 |

制約:

- `route_id` と `user_id` の組み合わせは一意にする
- 同じユーザーが同じ投稿に複数回いいねできないようにする

## 7. Supabase操作仕様

MVSでは独自APIサーバーを作らず、ReactからSupabaseクライアントを使って操作します。

### 7.1 認証

| 操作 | Supabase機能 | 画面 |
| --- | --- | --- |
| 新規登録 | `signUp` | signup |
| ログイン | `signInWithPassword` | login |
| ログアウト | `signOut` | logout |
| ログイン状態取得 | `getUser` または `onAuthStateChange` | 全画面 |

### 7.2 投稿一覧取得

対象テーブル:

- `routes`
- `route_photos`
- `route_likes`
- `profiles`

検索条件:

- キーワード: `title`, `summary`, `description`
- 都道府県: `routes.prefecture_code` または `route_prefectures.prefecture_code`
- 並び順: `created_at` の新しい順

### 7.3 投稿作成

保存先:

- `routes`
- `route_prefectures`
- `route_points`
- `route_photos`
- Supabase Storage

処理方針:

1. ログイン中ユーザーIDを取得する
2. 写真がある場合はSupabase Storageへアップロードする
3. `routes` に投稿本体を保存する
4. `route_prefectures` にメイン都道府県とサブ都道府県を保存する
5. `route_points` に地点情報を保存する
6. `route_photos` にStorageパスを保存する

### 7.4 投稿詳細取得

対象テーブル:

- `routes`
- `profiles`
- `route_prefectures`
- `route_points`
- `route_photos`
- `route_likes`

表示する情報:

- タイトル
- 概要
- 説明
- 投稿者名
- メイン都道府県
- サブ都道府県
- 住所
- 目的地サイトURL
- 地点情報
- 写真
- いいね数
- ログインユーザーがいいね済みか
- ログインユーザーが投稿者本人か

### 7.5 投稿編集、削除

投稿者本人だけが実行できます。

UI上で本人以外には編集、削除ボタンを表示しないことに加えて、SupabaseのRLSで本人以外が更新、削除できないようにします。

### 7.6 いいね、お気に入り

いいね:

- 未いいねの場合は `route_likes` にinsert
- いいね済みの場合は `route_likes` からdelete

お気に入り一覧:

- `route_likes.user_id` がログイン中ユーザーIDと一致する投稿を取得する

## 8. 権限設計

### 8.1 画面上の権限

| 操作 | ゲスト | ログインユーザー | 投稿者本人 |
| --- | --- | --- | --- |
| 投稿一覧を見る | 可 | 可 | 可 |
| 投稿詳細を見る | 可 | 可 | 可 |
| 投稿を作成する | 不可 | 可 | 可 |
| 投稿を編集する | 不可 | 不可 | 可 |
| 投稿を削除する | 不可 | 不可 | 可 |
| いいねする | 不可 | 可 | 可 |
| 自分のお気に入りを見る | 不可 | 可 | 可 |

### 8.2 Supabase RLS方針

RLSは必ず有効にします。

基本方針:

- `routes`: selectは全員可、insertはログインユーザーのみ、update/deleteは `user_id = auth.uid()` のみ
- `route_prefectures`: selectは全員可、insert/update/deleteは対象routeの投稿者のみ
- `route_points`: selectは全員可、insert/update/deleteは対象routeの投稿者のみ
- `route_photos`: selectは全員可、insert/update/deleteは対象routeの投稿者のみ
- `route_likes`: selectは全員可、insert/deleteはログインユーザー本人の `user_id = auth.uid()` のみ
- `profiles`: selectは全員可、insert/updateは本人のみ

## 9. 入力バリデーション

| 項目 | ルール |
| --- | --- |
| 表示名 | 必須 |
| メールアドレス | 必須、メール形式 |
| パスワード | 必須、6文字以上 |
| 投稿タイトル | 必須、100文字以内 |
| 概要 | 任意、255文字以内 |
| 説明 | 任意 |
| メイン都道府県 | 必須、都道府県コードとして有効 |
| サブ都道府県 | 任意、メイン都道府県と重複不可 |
| 住所 | 任意、255文字以内 |
| サイトURL | 任意、URL形式 |
| 写真 | 任意、最大10枚、jpg/png/webp推奨 |

## 10. デモで見せる流れ

1. 新規ユーザー登録を行う
2. ログイン状態になる
3. ルート投稿作成画面を開く
4. タイトル、概要、都道府県、地点、写真を入力する
5. 投稿を保存する
6. 投稿一覧に作成した投稿が表示される
7. 投稿詳細で写真、説明、地点、いいね数が表示される
8. 投稿者本人として編集、削除ボタンが表示される
9. 別ユーザーまたはゲストで一覧、詳細を閲覧できる
10. ログインユーザーがいいねし、お気に入り一覧で確認できる

## 11. 初期Issue

### Issue 1: React + Supabase環境の構築

目的:
ReactアプリからSupabaseへ接続できる状態を作る。

完了条件:

- Reactアプリが起動できる
- `.env.example` が用意されている
- Supabase URLとanon keyを環境変数で読み込める
- Supabaseクライアントの共通ファイルが作成されている
- READMEに起動手順が書かれている

### Issue 2: Supabaseテーブル作成

目的:
MVSに必要なテーブルをSupabase上に作成する。

完了条件:

- `profiles`
- `routes`
- `route_prefectures`
- `route_points`
- `route_photos`
- `route_likes`

上記テーブルが作成されている。

### Issue 3: RLSポリシー設定

目的:
Supabase上で閲覧、投稿、編集、削除の権限を安全に制御する。

完了条件:

- 各テーブルでRLSが有効になっている
- ゲストが一覧、詳細を閲覧できる
- ログインユーザーが投稿作成できる
- 投稿者本人だけが編集、削除できる
- ログインユーザーだけがいいねできる

### Issue 4: 認証画面実装

目的:
Supabase Authで登録、ログイン、ログアウトできるようにする。

完了条件:

- signup画面でユーザー登録できる
- login画面でログインできる
- logout処理ができる
- ログイン中ユーザー情報を画面で利用できる

### Issue 5: ルート投稿の縦切り実装

目的:
投稿作成から一覧表示、詳細表示までを最初に通す。

完了条件:

- ログインユーザーが投稿を作成できる
- Supabase Databaseに投稿、都道府県、地点が保存される
- Supabase Storageに写真が保存される
- 投稿一覧に表示される
- 投稿詳細に表示される

### Issue 6: 投稿編集、削除実装

目的:
既存Drive_mappingと同じように、投稿者本人が投稿を管理できるようにする。

完了条件:

- 投稿者本人にだけ編集、削除導線が表示される
- 投稿を編集できる
- 投稿を削除できる
- 本人以外はRLSにより更新、削除できない

### Issue 7: いいね、お気に入り実装

目的:
既存Drive_mappingと同じように、気になる投稿を保存できるようにする。

完了条件:

- ログインユーザーがいいねできる
- いいね解除できる
- いいね数が表示される
- お気に入り一覧で自分がいいねした投稿を確認できる

## 12. ブランチ運用

基本ルール:

- `main` ブランチへ直接コミットしない
- 作業ごとに `feature/xxx` ブランチを作成する
- Pull Requestを作ってレビューを受ける
- 画面担当者は、Supabaseのテーブル構成やカラム名を変更したくなった場合、先にチームへ共有する

ブランチ名の例:

- `feature/setup-react-supabase`
- `feature/supabase-schema`
- `feature/auth-pages`
- `feature/routes-index-page`
- `feature/routes-create-page`
- `feature/routes-detail-page`
- `feature/routes-edit-delete`
- `feature/route-like-favorites`

## 13. 実装前チェックリスト

- [ ] 採用技術がReact + Supabaseで統一されている
- [ ] 独自Node.js APIやMySQLを前提にしていない
- [ ] 自分の担当画面の画面IDとURLを確認した
- [ ] 使用するSupabaseテーブルを確認した
- [ ] DBカラム名を確認した
- [ ] 認証が必要な操作か確認した
- [ ] 投稿者本人だけができる操作か確認した
- [ ] RLSで権限が守られるか確認した
- [ ] MVS段階ではデザイン作り込みを優先しない方針を確認した
- [ ] mainブランチへ直接コミットしない方針を確認した
- [ ] Pull Requestでレビューを受ける準備ができている

## 14. ChatGPTに読み込ませる時の指示文

各担当者は、ChatGPTに実装を依頼する前に、次の文章を貼り付けてください。

```txt
これからDrive Mappingというツーリングルート共有アプリを制作します。
このアプリは既存の個人制作版Drive_mappingを参考にした新規開発です。

最初の目標は、既存Drive_mappingと同じような機能を持つMVSを完成させることです。
デザインや追加機能はMVS完成後にチームで検討するため、現時点では機能の再現とSupabase連携を優先してください。

添付または貼り付けた要件定義書を最優先の仕様として扱ってください。
開発環境はReact + Supabaseで統一します。
認証はSupabase Auth、DBはSupabase Database、画像保存はSupabase Storageを使います。
既存のPHP実装は参考元であり、新規開発ではPHPやMySQLや独自Node.js APIを前提にしないでください。

画面名、URL、Supabaseテーブル名、DBカラム名を独自に変更しないでください。
担当ページだけを実装する場合でも、共通のSupabase設計とRLS方針に合わせてください。

私の担当は「ここに担当画面または担当Issueを書く」です。
まず必要なファイル構成、実装方針、接続するSupabaseテーブル、注意点を整理してから実装してください。
```

## 15. 未決定事項

| 項目 | 現在の方針 | 決めること |
| --- | --- | --- |
| デザイン | MVS完成後に検討 | 色、レイアウト、コンポーネント設計 |
| 追加機能 | MVS完成後に検討 | プロフィール、フォロー、コメント等 |
| マップ描画 | MVSでは既存版に近い日本地図導線 | LeafletやGoogle Maps APIを使うか |
| サムネイル生成 | MVSでは必須にしない | Storage画像をどう最適化するか |
| 本番公開 | 未定 | Hosting先、環境変数管理 |

## 16. 既存Drive_mappingから確認できた参考機能

既存フォルダでは、次のような構成が確認できます。

- `htdocs/index.php`: 日本地図トップと投稿数表示
- `htdocs/register.php`: 新規登録
- `htdocs/login.php`: ログイン
- `htdocs/create.php`: 投稿作成、写真アップロード、地点登録
- `htdocs/routes/index.php`: 投稿一覧、キーワード検索、都道府県絞り込み
- `htdocs/routes/show.php`: 投稿詳細、写真表示、いいね
- `htdocs/routes/edit.php`: 投稿編集
- `htdocs/routes/update.php`: 投稿更新
- `htdocs/routes/delete.php`: 投稿削除
- `htdocs/routes/favorites.php`: いいね済み投稿一覧

新規開発では、この体験をReact + Supabase構成に置き換えて実装します。
