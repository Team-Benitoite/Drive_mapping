# 要件定義書

## 0. 基本情報

チーム名：Benitoite

プロダクト名：Drive Mapping

作成日：2026/05/16

更新日：2026/05/16

記録担当：坂地

関連リンク：

- GitHub Repository：https://github.com/Team-Benitoite/Drive_mapping.git
- GitHub Projects：https://github.com/Team-Benitoite/Drive_mapping
- 第2週企画メモ：
- Figma / 画面設計：
- デプロイ先：

## 1. プロダクト概要

### 1.1 一文説明

このプロダクトは、誰が、どのような課題を、どのように解決するものかを1文で書く。

```text
「ツーリング」をお題にしてツーリングを趣味としている人やそれに興味を持つ人を対象とするサービス。
```

### 1.2 想定ユーザー

主なユーザー：ツーリングやドライブを趣味にしている人

補助的なユーザー：行先などを決めかねている人

ユーザーが利用する場面：行先の決定するための補助

### 1.3 解決する課題

このプロダクトで解決する課題：引きこもり回避

なぜその課題が重要なのか：

既存の代替手段：

既存の代替手段で不足していること：

### 1.4 提供価値

このプロダクトが提供する価値：アウトドアを推奨し、ツーリングなどの魅力を知ってもらうこと

ユーザーにとって楽になること：ツーリング先の決定が容易になる

発表時に伝えたい価値：

## 2. MVPスコープ

### 2.1 MVPで作る機能

最初に価値を確認するために必要な機能だけを書く。

1.Map
2.認証
3.簡単なDB

### 2.2 今回は作らない機能

卒業制作の初期スコープから外す機能を書く。

1.凝ったフロントエンド
2.API
3.GPS

### 2.3 完成とみなす条件

第1段階の完成条件を書く。

- Mapping機能
- 認証
- 

### 2.4 デモで見せる流れ

発表で見せる最小の操作手順を書く。

1.登録
2.ログイン
3.mapdataの登録
4.googleなどに道を反映させて閲覧できる

## 3. ユーザーストーリー

MVPに必要なユーザーストーリーを3〜7個に絞る。

```text
ツーリングを趣味とする者として、
ツーリングがしたい。
なぜなら、ツーリングがしたいから。
```

### Story 1

```text
既存の記録アプリでは正確なルートが出ないため、不満を感じていた。
そのため、記録したルートのデータをそのままマップアプリに持っていくことができれば、短時間で手持ちのスマートフォンで表示させることができ、ルートの決定を短縮することができると感じた。
```

受け入れ条件：

- 
-
-

### Story 2

```text
興味はあるが手を出せていない人達に情報を共有し最初の一歩を踏み出していただきたいと考えている
```

受け入れ条件：

-
-
-

### Story 3

```text

```

受け入れ条件：

-
-
-

## 4. 画面設計

### 4.1 画面一覧

| 画面名 | 目的 | 主な情報 | 主な操作 |
|---|---|---|---|
| signup | ユーザー登録 | ユーザー情報 | 登録 |
| login | login  | 認証関連のデータ | ログイン |
| logout | ログアウト | 認証関連のデータ | ログアウト |
| index | マップの表示 | 行先データ | データの利用など |
| m_create | 行先データの登録 | 住所,写真 | 登録 |
| m_delete | 行先データの削除 | 住所,写真 | 削除 |
| m_edit | 行先データの編集| 〃 | 〃 |
| show | 都道府県別などで表示する | 都道府県データ | 検索、並べ替えなど |
| profile | プロフィールの表示,名前,フォロー | アイコン,背景 |
| p_edit | プロフィールの編集 | 個人情報 | 編集 |
| follower | フォロワーの表示 | アイコン, ユーザー名 | フォロワーの確認 | 
| follow | フォローの表示 | アイコン, ユーザー名 | フォローの確認 |





### 4.2 画面遷移

画面遷移図のリンク：

主要な画面遷移：

1. signup
2. login
3. index
4. m_create
5. m_delete
6. m_edit
7. show
8. detail
9. profile
10. p_edit
11. follower
12. follow
13. logout




### 4.3 画面ごとの要件

#### 画面名：signup

目的：signup

表示する情報：アカウント名, メールアドレス, パスワード

ユーザーができる操作：アカウントの登録

次に進む画面：index



#### 画面名：login

目的：login

表示する情報：メールアドレス, パスワード

ユーザーができる操作：必要事項入力

次に進む画面：index



#### 画面名：index

目的：ホーム画面

表示する情報：メニュー, 登録データ, マップデータ

ユーザーができる操作：登録データの閲覧, ページ移動

次に進む画面：signup, login, logout, m_create, m_delete, m_edit, profile, show



#### 画面名：m_create

目的：行先データの追加

表示する情報：タイトル, 内容, メイン（主な都道府県）, サブ（通った都道府県）, 出発地点名（住所含む）, 中間地点（〃）, 到着地点（〃）, 写真タイトルの入力欄, 写真データ,  画面遷移ボタン（index, show, logout）, キャンセルボタン

ユーザーができる操作：マップデータの登録

次に進む画面：index, logout



#### 画面名：m_delete

目的：行先データの削除

表示する情報：タイトル, 内容, メイン（主な都道府県）, サブ（通った都道府県）, 出発地点名（住所含む）, 中間地点（〃）, 到着地点（〃）, 写真タイトル, 写真データ,  画面遷移ボタン（index, show, logout）, 削除ボタン, キャンセルボタン

ユーザーができる操作：行先データの削除

次に進む画面：index, logout



#### 画面名：m_edit

目的：行先データの編集

表示する情報：タイトル, 内容, メイン（主な都道府県）, サブ（通った都道府県）, 出発地点名（住所含む）, 中間地点（〃）, 到着地点（〃）, 写真タイトルの入力欄, 写真データ,  画面遷移ボタン（index, show, logout）, キャンセルボタン

ユーザーができる操作：編集

次に進む画面：index, logout



#### 画面名：show

目的：登録データリスト閲覧

表示する情報：m_createで作成した行先データ

ユーザーができる操作：行先データの表示

次に進む画面：detail, index, logout



#### 画面名：detail

目的：詳細データ閲覧

表示する情報：m_createで作成した行先データ

ユーザーができる操作：行先データの閲覧, 行先データのルートURL, 画面遷移ボタン（index, logout）

次に進む画面：show, index, logout



#### 画面名：profile

目的：プロフィールの表示

表示する情報：アイコン, ユーザー名, アカウント登録の日付

ユーザーができる操作：プロフィール編集, フォロー

次に進む画面：p_edit, follower, follow, show



#### 画面名：p_edit

目的：プロフィール編集

表示する情報：アイコン, ユーザー名

ユーザーができる操作：プロフィール編集

次に進む画面：profile, index, logout



#### 画面名：logout

目的：ログアウト

表示する情報：ポップアップ

ユーザーができる操作：ログアウト

次に進む画面：home


## 5. データ設計

### 5.1 主要データ

-- データベース: `drive_mapping`
--

-- --------------------------------------------------------

--
-- テーブルの構造 `routes`
--

CREATE TABLE `routes` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `summary` varchar(255) DEFAULT NULL,
  `description` text,
  `address` varchar(255) DEFAULT NULL,
  `prefecture_code` tinyint UNSIGNED NOT NULL,
  `map_url` text,
  `site_url` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `route_likes`
--

CREATE TABLE `route_likes` (
  `id` bigint UNSIGNED NOT NULL,
  `route_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `route_photos`
--

CREATE TABLE `route_photos` (
  `id` bigint UNSIGNED NOT NULL,
  `route_id` bigint UNSIGNED NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `thumb_name` varchar(255) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `route_points`
--

CREATE TABLE `route_points` (
  `id` bigint UNSIGNED NOT NULL,
  `route_id` bigint UNSIGNED NOT NULL,
  `point_type` enum('start','middle','goal') NOT NULL,
  `label` varchar(100) NOT NULL,
  `url` text,
  `sort_order` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `route_prefectures`
--

CREATE TABLE `route_prefectures` (
  `id` bigint UNSIGNED NOT NULL,
  `route_id` bigint UNSIGNED NOT NULL,
  `prefecture_code` tinyint UNSIGNED NOT NULL,
  `is_main` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- テーブルの構造 `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `routes`
--
ALTER TABLE `routes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_routes_user` (`user_id`),
  ADD KEY `idx_routes_pref` (`prefecture_code`),
  ADD KEY `idx_routes_created` (`created_at`);

--
-- テーブルのインデックス `route_likes`
--
ALTER TABLE `route_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_route_user` (`route_id`,`user_id`),
  ADD KEY `idx_route` (`route_id`),
  ADD KEY `fk_likes_user` (`user_id`);

--
-- テーブルのインデックス `route_photos`
--
ALTER TABLE `route_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_route_photos_route` (`route_id`);

--
-- テーブルのインデックス `route_points`
--
ALTER TABLE `route_points`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_points_route` (`route_id`);

--
-- テーブルのインデックス `route_prefectures`
--
ALTER TABLE `route_prefectures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_rp_route` (`route_id`),
  ADD KEY `idx_rp_pref` (`prefecture_code`);

--
-- テーブルのインデックス `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `routes`
--
ALTER TABLE `routes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- テーブルの AUTO_INCREMENT `route_likes`
--
ALTER TABLE `route_likes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `route_photos`
--
ALTER TABLE `route_photos`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `route_points`
--
ALTER TABLE `route_points`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `route_prefectures`
--
ALTER TABLE `route_prefectures`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `routes`
--
ALTER TABLE `routes`
  ADD CONSTRAINT `fk_routes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- テーブルの制約 `route_likes`
--
ALTER TABLE `route_likes`
  ADD CONSTRAINT `fk_likes_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- テーブルの制約 `route_photos`
--
ALTER TABLE `route_photos`
  ADD CONSTRAINT `fk_route_photos_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE;

--
-- テーブルの制約 `route_points`
--
ALTER TABLE `route_points`
  ADD CONSTRAINT `fk_route_points_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE;

--
-- テーブルの制約 `route_prefectures`
--
ALTER TABLE `route_prefectures`
  ADD CONSTRAINT `fk_route_prefectures_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE;
COMMIT;


### 5.2 DB構成の初版

この時点では完璧なDB設計を目指さなくてよい。実装を始めるために必要な初版を書く。

#### テーブル名：

目的：

主なカラム：

-
-
-

主キー：

外部キー：

初期データの有無：

読み取り権限：

書き込み権限：

### 5.3 BaaSを使う場合

Supabaseを使う場合は、画面ごとに読み書きするテーブルを書く。
Firebaseなど別のBaaSを使う場合は、テーブルをコレクション、RLS方針をSecurity Rules方針として読み替える。

#### 画面名：

読むテーブル：

書くテーブル：

Firebaseの場合のコレクション：

Firebaseの場合のインデックス：

Firebaseの場合の初期データ投入手順：

認証の必要性：

RLS方針：

Security Rules方針：

注意点：

### 5.4 自作APIを使う場合

自作APIを使う場合は、DBとAPI操作の対応を書く。

#### API：

```text
GET /example
```

目的：

読むテーブル：

書くテーブル：

認証の必要性：

関連する画面：



## 6. API / BaaS操作

### 6.1 API候補

| 操作 | 目的 | 認証 | 関連画面 |
|---|---|---|---|
| GET /example |  |  |  |

### 6.2 BaaS操作候補

| 画面 | 読むテーブル | 書くテーブル | 権限 |
|---|---|---|---|
|  |  |  |  |

## 7. 初期Issue

第5週で着手するIssueを書く。Issueには、目的、完了条件、担当者を含める。

### Issue 1

タイトル：

種類：

- [ ] 要件定義Issue
- [ ] 画面Issue
- [ ] データIssue
- [ ] 機能Issue
- [ ] DB設計Issue
- [ ] API設計Issue
- [ ] 環境構築Issue
- [ ] 実装Issue
- [ ] 調査Issue

目的：

完了条件：

-
-
-

担当者：



### Issue 2以降

Issue 1と同じ形式で、必要な数だけ追加する。
各IssueはMarkdownに書くだけで終わらせず、GitHub Issuesにも作成し、GitHub Projectsで追跡できるようにする。

GitHub Issue URL：

## 8. 実装へ進む前のチェック

次の項目を満たしたチームは、最小の実装に入ってよい。

- [x] 想定ユーザーと解決する課題を説明できる。
- [x] MVPで作る機能を3〜7個に絞っている。
- [x] 今回は作らない機能を明記している。
- [x] 主要画面を一覧化している。
- [ ] 主要データを一覧化している。
- [ ] 主要データの読み取り権限と書き込み権限を説明できる。
- [x] 要件定義MarkdownをPull Requestで追加または更新している。
- [ ] 最初に実装するIssueを1つ選んでいる。
- [ ] そのIssueの完了条件が書かれている。
- [ ] 実装ブランチを切って作業する準備ができている。
- [ ] mainブランチへ直接コミットしない方針を確認している。

## 9. 最小の縦切り実装

要件定義の最低ラインを満たしたチームは、最小の縦切り実装に進む。

選ぶユーザーストーリー：

最初に作る画面：

必要なデータ：

必要なAPIまたはBaaS操作：

確認方法：

作成するPull Request：

レビュー担当：

## 10. 未決定事項

まだ決まっていないことを書く。

| 項目 | 状態 | 次にやること |
|---|---|---|
|  |  |  |

## 11. 講師レビュー欄

講師からのコメント：

次回までに修正すること：

-
-
-