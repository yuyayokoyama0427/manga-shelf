-- =============================================
-- manga-shelf Supabaseスキーマ定義
-- ※このファイルを実行するのはSupabaseダッシュボード上
-- =============================================

-- ユーザープロファイル
create table profiles (
  id uuid references auth.users on delete cascade,
  is_pro boolean default false,
  created_at timestamp with time zone default now(),
  primary key (id)
);

-- シリーズ（漫画）
create table series (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  author text,
  cover_url text,
  total_volumes int,
  created_at timestamp with time zone default now()
);

-- 所持巻数
create table volumes (
  id uuid default gen_random_uuid() primary key,
  series_id uuid references series(id) on delete cascade,
  volume_number int not null,
  price int,
  purchased_at date
);

-- RLS（自分のデータのみアクセス可）
alter table profiles enable row level security;
alter table series enable row level security;
alter table volumes enable row level security;

create policy "自分のプロファイルのみ" on profiles
  for all using (auth.uid() = id);

create policy "自分のシリーズのみ" on series
  for all using (auth.uid() = user_id);

create policy "自分のシリーズの巻のみ" on volumes
  for all using (
    series_id in (select id from series where user_id = auth.uid())
  );

-- プロファイルを自動作成するトリガー
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
