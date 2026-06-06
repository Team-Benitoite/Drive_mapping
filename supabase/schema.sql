-- =============================================================
-- Drive Mapping - Supabase スキーマ定義
-- Supabase ダッシュボード > SQL Editor に貼り付けて実行してください。
-- =============================================================

-- -------------------------------------------------------------
-- profiles : 公開プロフィール（auth.users と 1:1 で対応）
--   認証情報そのもの（email/password）は Supabase Auth (auth.users) が管理する。
--   表示名などの公開情報のみここで保持する。
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- -------------------------------------------------------------
-- routes : ルートの大枠データ
-- -------------------------------------------------------------
create table if not exists public.routes (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  title            text not null,
  summary          text,
  description      text,
  prefecture_code  text,
  created_at       timestamptz not null default now()
);
create index if not exists routes_user_id_idx on public.routes (user_id);
create index if not exists routes_prefecture_idx on public.routes (prefecture_code);

-- -------------------------------------------------------------
-- route_points : ルートを構成する経由地
--   point_type: start / middle / goal
--   seq       : 並び順（0 始まり）
-- -------------------------------------------------------------
create table if not exists public.route_points (
  id          bigint generated always as identity primary key,
  route_id    bigint not null references public.routes (id) on delete cascade,
  point_type  text not null check (point_type in ('start', 'middle', 'goal')),
  seq         int not null default 0,
  label       text,
  lat         double precision not null,
  lng         double precision not null
);
create index if not exists route_points_route_id_idx on public.route_points (route_id);

-- -------------------------------------------------------------
-- route_likes : いいね（中間テーブル）
-- -------------------------------------------------------------
create table if not exists public.route_likes (
  id          bigint generated always as identity primary key,
  route_id    bigint not null references public.routes (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (route_id, user_id)
);

-- =============================================================
-- 新規ユーザー登録時に profiles 行を自動作成するトリガー
--   サインアップ時の user_metadata.name を表示名として使う。
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Row Level Security (RLS) ポリシー
--   要件の権限モデル:
--     読み取り = 誰でも可 / 書き込み = 本人（作成者）のみ
-- =============================================================
alter table public.profiles    enable row level security;
alter table public.routes      enable row level security;
alter table public.route_points enable row level security;
alter table public.route_likes  enable row level security;

-- profiles -----------------------------------------------------
drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- routes -------------------------------------------------------
drop policy if exists "routes are viewable by everyone" on public.routes;
create policy "routes are viewable by everyone"
  on public.routes for select using (true);

drop policy if exists "users can insert own routes" on public.routes;
create policy "users can insert own routes"
  on public.routes for insert with check (auth.uid() = user_id);

drop policy if exists "users can update own routes" on public.routes;
create policy "users can update own routes"
  on public.routes for update using (auth.uid() = user_id);

drop policy if exists "users can delete own routes" on public.routes;
create policy "users can delete own routes"
  on public.routes for delete using (auth.uid() = user_id);

-- route_points : 親 route の作成者のみ書き込み可、閲覧は誰でも -----
drop policy if exists "route_points are viewable by everyone" on public.route_points;
create policy "route_points are viewable by everyone"
  on public.route_points for select using (true);

drop policy if exists "owner can insert route_points" on public.route_points;
create policy "owner can insert route_points"
  on public.route_points for insert with check (
    exists (
      select 1 from public.routes r
      where r.id = route_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "owner can modify route_points" on public.route_points;
create policy "owner can modify route_points"
  on public.route_points for update using (
    exists (
      select 1 from public.routes r
      where r.id = route_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "owner can delete route_points" on public.route_points;
create policy "owner can delete route_points"
  on public.route_points for delete using (
    exists (
      select 1 from public.routes r
      where r.id = route_id and r.user_id = auth.uid()
    )
  );

-- route_likes : 閲覧は誰でも、追加/削除は本人のみ ------------------
drop policy if exists "likes are viewable by everyone" on public.route_likes;
create policy "likes are viewable by everyone"
  on public.route_likes for select using (true);

drop policy if exists "users can like" on public.route_likes;
create policy "users can like"
  on public.route_likes for insert with check (auth.uid() = user_id);

drop policy if exists "users can unlike" on public.route_likes;
create policy "users can unlike"
  on public.route_likes for delete using (auth.uid() = user_id);
